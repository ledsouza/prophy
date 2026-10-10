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

Cloudflare Worker prophy-proxy (infra/cloudflare/)
  └─ Proxies api.phystack.com.br / portal.phystack.com.br → *.run.app origins

Cloud Monitoring
  ├─ Uptime checks → backend + frontend custom domain URLs
  └─ Alert policies → email leandro.souza.159@gmail.com
```

### Services

| Service | Public URL | Cloud Run origin URL | Service account |
|---------|-----------|----------------------|-----------------|
| Backend (Django) | `https://api.phystack.com.br` | `https://prophy-backend-341810477176.southamerica-east1.run.app` | `backend-sa` |
| Frontend (Next.js) | `https://portal.phystack.com.br` | `https://prophy-frontend-341810477176.southamerica-east1.run.app` | `frontend-sa` |
| Database | — | Cloud SQL PostgreSQL 15 `prophy-postgres` | — |
| Media storage | — | GCS bucket `prophy-documents-prod` | — |
| Images | — | Artifact Registry `southamerica-east1-docker.pkg.dev/prophy-497315/prophy/` | — |

The public URLs resolve to a Cloudflare Worker, which proxies to the Cloud Run
origin URLs over HTTPS. The `phystack.com.br` hostnames stand in until the
client's `prophy.net.br` domain is moved over. See [Custom domains](#custom-domains-cloudflare-proxy)
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
| `DJANGO_ALLOWED_HOSTS` | Cloud Run env (GitHub Actions vars `BACKEND_HOST`, `BACKEND_ORIGIN_HOST`) | `api.phystack.com.br,prophy-backend-341810477176.southamerica-east1.run.app,localhost` |
| `CSRF_TRUSTED_ORIGINS` | Cloud Run env | `https://api.phystack.com.br` |
| `CORS_ALLOWED_ORIGINS` | Cloud Run env (GitHub Actions var `FRONTEND_HOST`) | `https://portal.phystack.com.br` |
| `OIDC_AUDIENCE` | Cloud Run env (GitHub Actions var `OIDC_AUDIENCE`) | `https://prophy-backend-341810477176.southamerica-east1.run.app` |
| `FRONTEND_URL` | Cloud Run env | `https://portal.phystack.com.br` |
| `DEFAULT_FROM_EMAIL` | Cloud Run env (GitHub Actions var `DEFAULT_FROM_EMAIL`) | `noreply@prophy.com` |
| `DOMAIN` | Cloud Run env (GitHub Actions var `MAILGUN_DOMAIN`) | `mg.prophy.com` |
| `DJANGO_SECRET_KEY` | Secret Manager `django-secret-key` | — |
| `POSTGRES_PASSWORD` | Secret Manager `postgres-password` | — |
| `MAILGUN_API_KEY` | Secret Manager `mailgun-api-key` | — |

### Frontend (build args — baked into image at `next build`)

| Variable | Source | Example value |
|----------|--------|---------------|
| `NEXT_PUBLIC_HOST` | `--build-arg` (GitHub Actions var `BACKEND_HOST`) | `https://api.phystack.com.br` |
| `CANONICAL_HOST` | `--build-arg` (GitHub Actions var `FRONTEND_HOST`) | `portal.phystack.com.br` |
| `HOSTNAME` | Cloud Run env | `0.0.0.0` |

### GitHub Actions variables (Settings → Secrets and variables → Actions → Variables)

| Variable | Value |
|----------|-------|
| `WIF_PROVIDER` | Terraform output `workload_identity_provider` |
| `CI_SA_EMAIL` | Terraform output `ci_sa_email` |
| `CLOUD_SQL_CONNECTION_NAME` | Terraform output `cloud_sql_connection_name` |
| `GCS_BUCKET_NAME` | Terraform output `media_bucket_name` |
| `BACKEND_HOST` | Public backend hostname (no scheme) |
| `BACKEND_ORIGIN_HOST` | Cloud Run backend hostname (no scheme) |
| `FRONTEND_HOST` | Public frontend hostname (no scheme) |
| `OIDC_AUDIENCE` | `https://` + `BACKEND_ORIGIN_HOST` |
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
2. Push to `main` — the frontend pipeline builds (baking `NEXT_PUBLIC_HOST` and `CANONICAL_HOST`) and deploys.

Both pipelines can be re-triggered via **Actions → Re-run all jobs** if the image already exists.

### Smoke tests

- [ ] **Login / logout** — POST `https://<backend>/api/jwt/create/` returns `Set-Cookie: access=...; SameSite=None; Secure; HttpOnly`; subsequent requests from the frontend include the cookie.
- [ ] **File upload** — upload an equipment photo; verify the file persists in GCS (`gsutil ls gs://prophy-documents-prod/`) after a container restart.
- [ ] **Canonical hostname redirect** — the frontend's Cloud Run origin URL answers `307` with a `Location` on the public hostname, and the public hostname answers `200` with no `Location`:
  ```bash
  curl -sI https://<frontend-origin>/auth/login/ | grep -iE "^HTTP|^location"
  curl -sI https://<frontend>/auth/login/ | grep -iE "^HTTP|^location"
  ```
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

Routing to a named revision pins traffic there: later `gcloud run deploy`
runs create revisions that receive no traffic, although CI still reports
success. Once the fix is deployed, unpin both services:

```bash
gcloud run services update-traffic prophy-backend \
  --region southamerica-east1 --to-latest
gcloud run services update-traffic prophy-frontend \
  --region southamerica-east1 --to-latest
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

Cloud Run's native domain mapping (`gcloud run domain-mappings create`) does
not support `southamerica-east1`, where both services and the database run.
A plain proxied Cloudflare CNAME does not work either: Cloudflare forwards the
browser's `Host` header, Cloud Run has no service registered under that name,
and Google's edge answers with a 404 before the request reaches the container.
Rewriting `Host` needs an Enterprise Origin Rule or a Worker; on the Free plan
only a Worker is available.

### Worker

The Worker `prophy-proxy` lives in `infra/cloudflare/`. It maps each public
hostname to its Cloud Run origin, sets the outbound `Host` to the `*.run.app`
hostname, passes the public one (lowercase, without a port) in
`X-Forwarded-Host`, and returns the origin
response untouched so the separate `access` and `refresh` `Set-Cookie` headers
survive. Requests use `cache: "no-store"` so authenticated responses are
never cached.

The hostnames are bound as Workers **Custom Domains**, not Routes: Cloudflare
creates the DNS records and edge certificates itself. A custom domain cannot
be created on a hostname that already has a DNS record, so delete any existing
`api` / `portal` CNAME first.

Deploy from `infra/cloudflare/` with Node.js 22 or newer:

```bash
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... npx wrangler deploy
```

The token uses the **Edit Cloudflare Workers** template, scoped to the
account and the domain's zone.

Cost: the Workers free tier allows 100,000 requests a day across the whole
Cloudflare account, shared by both hostnames and the uptime checks. Above
that, the paid tier is US$5 a month.

### Application configuration

GitHub Actions variables:

| Variable | Value |
|----------|-------|
| `BACKEND_HOST` | `api.phystack.com.br` |
| `BACKEND_ORIGIN_HOST` | `prophy-backend-341810477176.southamerica-east1.run.app` |
| `FRONTEND_HOST` | `portal.phystack.com.br` |
| `OIDC_AUDIENCE` | `https://prophy-backend-341810477176.southamerica-east1.run.app` |

`DJANGO_ALLOWED_HOSTS` carries both backend hostnames. With
`USE_X_FORWARDED_HOST` enabled in `prod.py`, proxied requests are validated
against the public hostname from `X-Forwarded-Host`, while Cloud Scheduler
and direct debugging requests arrive under the `*.run.app` name. The origin
stays publicly reachable and `X-Forwarded-Host` can be forged, so keep
`ALLOWED_HOSTS` an exact list and never add wildcards.

After changing the variables, re-run both pipelines. The frontend must be
rebuilt, not only redeployed, because `NEXT_PUBLIC_HOST` is compiled into the
JavaScript bundle and `CANONICAL_HOST` into the redirect table at
`next build`.

### Redirecting the Cloud Run URL

The frontend's `*.run.app` URL cannot be switched off, because the Worker
uses it as its origin. Left alone it serves a portal that cannot log in:
the page calls the API from an origin that is not in `CORS_ALLOWED_ORIGINS`,
so the browser blocks the request. Adding that origin would not help
either. The `access` and `refresh` cookies are set by `api.phystack.com.br`,
which is a different site from `run.app`, and browsers increasingly drop
such third-party cookies.

Instead, `redirects()` in `frontend/next.config.mjs` answers page and
`public/` file requests that were not addressed to `CANONICAL_HOST` with a
`307` to that hostname, keeping the path and query string. A request counts
as addressed to the canonical hostname when either `X-Forwarded-Host` (set
by the Worker) or `Host` equals it. The `Host` condition makes the redirect
a no-op whenever `FRONTEND_HOST` is the Cloud Run hostname itself, and keeps
it correct if a future proxy forwards `Host` unchanged.

Three details of how Next.js applies the rule:

- Paths under `/_next/` (bundles and the image optimizer) are never
  redirected. A page has to load before it requests them, so this does not
  leave a usable entry point on the `*.run.app` URL.
- The `Location` has no trailing slash, so a redirected page takes one more
  hop on the public hostname, where the app's own trailing-slash redirect
  adds it back.
- The image optimizer loads files in `public/` through the same router with
  a request that carries no headers. The rule requires a `Host` header so
  that those internal requests are served; without that, optimized images
  such as the navigation bar logo answer `400`.

An empty `CANONICAL_HOST` disables the redirect, which is how local
development runs. The staging stack sets it to `proxy`, the hostname
Cypress browses, and `frontend/cypress/e2e/canonical_host_redirect.cy.ts`
checks each branch of the rule there. Cloud Run's startup probe is a TCP
check and the uptime check goes through the public hostname, so neither is
affected.

If the public hostname ever redirects to itself in a loop,
`X-Forwarded-Host` is not reaching the container: check that the Worker
still sets it, and roll the frontend back to the previous revision in
the meantime.

The backend's `*.run.app` URL is left reachable on purpose: Cloud
Scheduler calls it directly.

Terraform (`infra/terraform/terraform.tfvars`):

```hcl
backend_run_url   = "https://prophy-backend-341810477176.southamerica-east1.run.app"
backend_run_host  = "api.phystack.com.br"
frontend_run_host = "portal.phystack.com.br"
```

Uptime checks use the public hostnames, so they watch the path users take.
`backend_run_url` stays on `*.run.app`: Cloud Scheduler calls the origin
directly, skipping the proxy and its request quota, and `OIDC_AUDIENCE`
must match it exactly.

### Migrating to a different domain

The frontend redirects every hostname except `FRONTEND_HOST` to
`FRONTEND_HOST`, so the Worker must serve the old and the new hostnames
side by side until the rebuilt frontend is live. Replacing them in one step
leaves the new hostname redirecting to an old one that no longer resolves.

1. Add the domain to the Cloudflare account and delete any existing records
   for the two new hostnames.
2. Add the new hostnames to `infra/cloudflare/wrangler.toml` and to the
   `ORIGINS` map in `infra/cloudflare/src/index.js`, keeping the old
   entries, then deploy the Worker. The old hostnames keep working; the new
   portal hostname redirects to the old one for now.
3. Update `BACKEND_HOST` and `FRONTEND_HOST`, then re-run both pipelines.
   From here the new hostnames are canonical and the old portal hostname
   redirects to the new one.
4. Update `backend_run_host` and `frontend_run_host`, then `terraform apply`.
5. Run the canonical hostname redirect smoke test against the new hostname.
6. Optionally remove the old hostnames from the Worker and redeploy.
   Keeping the old portal hostname is what sends existing bookmarks to the
   new domain. The old API hostname serves nothing useful after step 3,
   because the backend no longer lists it in `DJANGO_ALLOWED_HOSTS`.

### Rolling back the proxy

Set `BACKEND_HOST` and `FRONTEND_HOST` back to the `*.run.app` hostnames,
re-run both pipelines, and use `gcloud run services update-traffic` to
return to the previous revisions if needed. The rebuilt frontend stops
redirecting on its own, because its canonical hostname is then the
`*.run.app` one. Deleting the Worker's custom
domains disables the proxy but leaves the edge certificates Cloudflare
issued; delete those under **SSL/TLS → Edge Certificates** for a clean slate.
