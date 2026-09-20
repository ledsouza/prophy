# Deployment Guide

## Architecture

```
GitHub Actions (CI/CD)
  └─ WIF → cicd-sa
       ├─ Build & push Docker images → Artifact Registry
       ├─ Execute Cloud Run Job (prophy-migrate) → Cloud SQL
       ├─ Deploy prophy-backend (Cloud Run) → Cloud SQL, GCS, Secret Manager
       └─ Deploy prophy-frontend (Cloud Run)

Cloud Scheduler (scheduler-sa, paused until enabled)
  └─ OIDC POST → prophy-backend /api/*/tasks/*

Cloudflare (DNS + TLS proxy, in front of both custom domains)
  └─ Proxies api.prophy.net.br / portal.prophy.net.br → *.run.app origins

Cloud Monitoring
  ├─ Uptime checks → backend + frontend custom domain URLs
  └─ Alert policies → email leandro.souza.159@gmail.com
```

### Services

| Service | Public URL | Cloud Run origin URL | Service account |
|---------|-----------|----------------------|-----------------|
| Backend (Django) | `https://api.prophy.net.br` | `https://prophy-backend-341810477176.southamerica-east1.run.app` | `backend-sa` |
| Frontend (Next.js) | `https://portal.prophy.net.br` | `https://prophy-frontend-341810477176.southamerica-east1.run.app` | `frontend-sa` |
| Database | — | Cloud SQL PostgreSQL 15 `prophy-postgres` | — |
| Media storage | — | GCS bucket `prophy-documents-prod` | — |
| Images | — | Artifact Registry `southamerica-east1-docker.pkg.dev/prophy-497315/prophy/` | — |

The public URLs resolve through Cloudflare, which proxies to the Cloud Run
origin URLs over HTTPS. See [Custom domains](#custom-domains-cloudflare-proxy)
for how that's wired up and what to change if the domain ever moves.

---

## Environment variable reference

### Backend (Cloud Run env vars)

| Variable | Source | Example value |
|----------|--------|---------------|
| `DATABASE_ENGINE` | Cloud Run env | `postgres` |
| `POSTGRES_HOST` | Cloud Run env | `/cloudsql/<project>:<region>:<instance>` |
| `POSTGRES_DB` | Cloud Run env | `prophy` |
| `POSTGRES_USER` | Cloud Run env | `prophy` |
| `GCS_BUCKET_NAME` | Cloud Run env (GitHub Actions var `GCS_BUCKET_NAME`) | `prophy-documents-prod` |
| `DJANGO_ALLOWED_HOSTS` | Cloud Run env (GitHub Actions var `BACKEND_HOST`) | `api.prophy.net.br,localhost` |
| `CSRF_TRUSTED_ORIGINS` | Cloud Run env | `https://api.prophy.net.br` |
| `CORS_ALLOWED_ORIGINS` | Cloud Run env (GitHub Actions var `FRONTEND_HOST`) | `https://portal.prophy.net.br` |
| `OIDC_AUDIENCE` | Cloud Run env (GitHub Actions var `OIDC_AUDIENCE`) | `https://api.prophy.net.br` |
| `FRONTEND_URL` | Cloud Run env | `https://portal.prophy.net.br` |
| `DEFAULT_FROM_EMAIL` | Cloud Run env (GitHub Actions var `DEFAULT_FROM_EMAIL`) | `noreply@prophy.com` |
| `DOMAIN` | Cloud Run env (GitHub Actions var `MAILGUN_DOMAIN`) | `mg.prophy.com` |
| `DJANGO_SECRET_KEY` | Secret Manager `django-secret-key` | — |
| `POSTGRES_PASSWORD` | Secret Manager `postgres-password` | — |
| `MAILGUN_API_KEY` | Secret Manager `mailgun-api-key` | — |

### Frontend (build arg — baked into image at `next build`)

| Variable | Source | Example value |
|----------|--------|---------------|
| `NEXT_PUBLIC_HOST` | `--build-arg` (GitHub Actions var `BACKEND_HOST`) | `https://api.prophy.net.br` |
| `HOSTNAME` | Cloud Run env | `0.0.0.0` |

### GitHub Actions variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Value |
|----------|-------|
| `WIF_PROVIDER` | Terraform output `workload_identity_provider` |
| `CI_SA_EMAIL` | Terraform output `ci_sa_email` |
| `CLOUD_SQL_CONNECTION_NAME` | Terraform output `cloud_sql_connection_name` |
| `GCS_BUCKET_NAME` | Terraform output `media_bucket_name` |
| `BACKEND_HOST` | Cloud Run backend hostname (no scheme) |
| `FRONTEND_HOST` | Cloud Run frontend hostname (no scheme) |
| `OIDC_AUDIENCE` | Full backend URL with scheme |
| `DEFAULT_FROM_EMAIL` | e.g. `noreply@prophy.com` |
| `MAILGUN_DOMAIN` | e.g. `mg.prophy.com` |

---

## First-deploy checklist

### Prerequisites

- [ ] `gcloud auth login` and `gcloud config set project prophy-497315`
- [ ] Terraform state bucket exists (`prophy-tfstate` in GCS)
- [ ] `backend/.env` has production values (not committed; managed locally or via Secret Manager)
- [ ] All GitHub Actions variables listed above are set in repository settings

### Provision infrastructure

```bash
cd infra/terraform
terraform init
terraform plan   # review — sensitive vars (db_password, backend_image_uri) are prompted
terraform apply
```

After apply, capture outputs for GitHub Actions variables:

```bash
terraform output -json | jq '{
  wif_provider: .workload_identity_provider.value,
  ci_sa_email: .ci_sa_email.value,
  cloud_sql_connection_name: .cloud_sql_connection_name.value,
  media_bucket_name: .media_bucket_name.value,
  backend_sa_email: .backend_sa_email.value,
  frontend_sa_email: .frontend_sa_email.value
}'
```

### Run CI pipelines

1. Push to `main` — the backend pipeline builds the image, runs migrations, and deploys.
2. Push to `main` — the frontend pipeline builds (baking `NEXT_PUBLIC_HOST`) and deploys.

Both pipelines can be re-triggered via **Actions → Re-run all jobs** if the image already exists.

### Smoke tests

- [ ] **Login / logout** — POST `https://<backend>/api/jwt/create/` returns `Set-Cookie: access=...; SameSite=None; Secure; HttpOnly`; subsequent requests from the frontend include the cookie.
- [ ] **File upload** — upload an equipment photo; verify the file persists in GCS (`gsutil ls gs://prophy-documents-prod/`) after a container restart.
- [ ] **Django admin** — `https://<backend>/admin/` loads correctly.
- [ ] **Scheduled task (manual trigger)** — call one task endpoint with a valid OIDC token:
  ```bash
  TOKEN=$(gcloud auth print-identity-token --audiences=<OIDC_AUDIENCE>)
  curl -X POST -H "Authorization: Bearer $TOKEN" \
    https://<backend>/api/reports/tasks/run-report-notifications/
  ```
  Expect HTTP 200.
- [ ] **Email (Mailgun)** — trigger a flow that sends an email; confirm delivery in the Mailgun dashboard.

---

## Rollback procedure

Each `gcloud run deploy` creates a new revision. To roll back to the previous
revision:

```bash
# List recent revisions
gcloud run revisions list --service prophy-backend --region southamerica-east1

# Route 100% of traffic to a specific revision
gcloud run services update-traffic prophy-backend \
  --region southamerica-east1 \
  --to-revisions=<REVISION_NAME>=100

# Same for frontend
gcloud run services update-traffic prophy-frontend \
  --region southamerica-east1 \
  --to-revisions=<REVISION_NAME>=100
```

---

## Enabling Cloud Scheduler jobs

The three scheduled jobs are created in Terraform with `paused = true`. To
enable them once the stakeholder has verified the application:

1. In `infra/terraform/cloud_scheduler.tf`, change `paused = true` to
   `paused = false` for each job you want to enable.
2. Apply:
   ```bash
   terraform apply \
     -target=google_cloud_scheduler_job.report_notifications \
     -target=google_cloud_scheduler_job.overdue_appointments \
     -target=google_cloud_scheduler_job.contract_notifications
   ```

### Scheduled job reference

| Job | Schedule (BRT) | Endpoint |
|-----|---------------|----------|
| `prophy-report-notifications` | Weekdays 08:00 | `POST /api/reports/tasks/run-report-notifications/` |
| `prophy-overdue-appointments` | Daily 07:00 | `POST /api/appointments/tasks/update-overdue/` |
| `prophy-contract-notifications` | Weekdays 08:00 | `POST /api/proposals/tasks/run-contract-notifications/` |

---

## Custom domains (Cloudflare proxy)

Cloud Run has a native custom-domain feature (`gcloud run domain-mappings
create`) that provisions a Google-managed TLS certificate automatically, but
it is only available in a subset of Cloud Run regions and does not cover
`southamerica-east1`, where both services run. Custom domains are instead
handled by pointing DNS at Cloudflare, which proxies requests to the
underlying `*.run.app` hostnames over HTTPS.

### DNS (Cloudflare)

| Record | Type | Target | Proxy status |
|--------|------|--------|--------------|
| `api.prophy.net.br` | CNAME | `prophy-backend-341810477176.southamerica-east1.run.app` | Proxied (orange cloud) |
| `portal.prophy.net.br` | CNAME | `prophy-frontend-341810477176.southamerica-east1.run.app` | Proxied (orange cloud) |

The Cloudflare SSL/TLS mode is set to **Full (strict)**: Cloudflare opens its
own HTTPS connection to the `*.run.app` origin, which presents Google's
managed certificate (valid, so strict validation passes), and separately
terminates a certificate for the custom domain at Cloudflare's edge. Cloud
Run never sees or manages a certificate for the custom domain.

Cloudflare forwards the original `Host` header it received from the browser
(the custom domain) to the origin rather than rewriting it to the `*.run.app`
hostname, so the application must be configured to trust that hostname
explicitly — see below.

### Application configuration

Set these GitHub Actions repository variables (Settings → Secrets and
variables → Actions → Variables) to the custom domains:

- `BACKEND_HOST` → `api.prophy.net.br`
- `FRONTEND_HOST` → `portal.prophy.net.br`
- `OIDC_AUDIENCE` → `https://api.prophy.net.br`

Then re-run both CI pipelines. The backend deploy picks up the new
`DJANGO_ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOWED_ORIGINS`
values; the frontend rebuild bakes the new `NEXT_PUBLIC_HOST` build-arg,
which only takes effect on a rebuild since it is compiled into the
JavaScript bundle at `next build` rather than read at container runtime.

Update `infra/terraform/terraform.tfvars` to match, then `terraform apply` to
update the Cloud Monitoring uptime checks and the Cloud Scheduler jobs'
target URL and OIDC audience:

```hcl
backend_run_url   = "https://api.prophy.net.br"
backend_run_host  = "api.prophy.net.br"
frontend_run_host = "portal.prophy.net.br"
```

No changes are needed in `backend/core/settings/prod.py` — `ALLOWED_HOSTS`,
`CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOWED_ORIGINS` are all read from
environment variables, so updating the GitHub Actions variables above and
redeploying is sufficient.

### Migrating to a different domain later

Repeat the DNS setup above with the new hostname, then the three application
steps (GitHub Actions variables, CI re-run, Terraform variables + apply)
with the new hostnames in place of `api.prophy.net.br` / `portal.prophy.net.br`.
