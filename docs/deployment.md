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

Cloud Monitoring
  ├─ Uptime checks → backend + frontend *.run.app URLs
  └─ Alert policies → email leandro.souza.159@gmail.com
```

### Services

| Service | URL (current) | Service account |
|---------|--------------|-----------------|
| Backend (Django) | `https://prophy-backend-341810477176.southamerica-east1.run.app` | `backend-sa` |
| Frontend (Next.js) | `https://prophy-frontend-341810477176.southamerica-east1.run.app` | `frontend-sa` |
| Database | Cloud SQL PostgreSQL 15 `prophy-postgres` | — |
| Media storage | GCS bucket `prophy-documents-prod` | — |
| Images | Artifact Registry `southamerica-east1-docker.pkg.dev/prophy-497315/prophy/` | — |

> When custom domains go live, update the URLs in the table above and in
> `infra/terraform/terraform.tfvars` (`backend_run_host`, `frontend_run_host`,
> `backend_run_url`). See [Custom domain migration](#custom-domain-migration).

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
| `DJANGO_ALLOWED_HOSTS` | Cloud Run env (GitHub Actions var `BACKEND_HOST`) | `prophy-backend-341810477176.southamerica-east1.run.app,localhost` |
| `CSRF_TRUSTED_ORIGINS` | Cloud Run env | `https://prophy-backend-341810477176.southamerica-east1.run.app` |
| `CORS_ALLOWED_ORIGINS` | Cloud Run env (GitHub Actions var `FRONTEND_HOST`) | `https://prophy-frontend-341810477176.southamerica-east1.run.app` |
| `OIDC_AUDIENCE` | Cloud Run env (GitHub Actions var `OIDC_AUDIENCE`) | `https://prophy-backend-341810477176.southamerica-east1.run.app` |
| `FRONTEND_URL` | Cloud Run env | `https://prophy-frontend-341810477176.southamerica-east1.run.app` |
| `DEFAULT_FROM_EMAIL` | Cloud Run env (GitHub Actions var `DEFAULT_FROM_EMAIL`) | `noreply@prophy.com` |
| `DOMAIN` | Cloud Run env (GitHub Actions var `MAILGUN_DOMAIN`) | `mg.prophy.com` |
| `DJANGO_SECRET_KEY` | Secret Manager `django-secret-key` | — |
| `POSTGRES_PASSWORD` | Secret Manager `postgres-password` | — |
| `MAILGUN_API_KEY` | Secret Manager `mailgun-api-key` | — |

### Frontend (build arg — baked into image at `next build`)

| Variable | Source | Example value |
|----------|--------|---------------|
| `NEXT_PUBLIC_HOST` | `--build-arg` (GitHub Actions var `BACKEND_HOST`) | `https://prophy-backend-341810477176.southamerica-east1.run.app` |
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

## Custom domain migration

When the stakeholder configures DNS for `api.prophy.com` and `app.prophy.com`:

1. **Cloud Run domain mapping** — configure in Cloud Console or via `gcloud`:
   ```bash
   gcloud run domain-mappings create --service prophy-backend \
     --domain api.prophy.com --region southamerica-east1
   gcloud run domain-mappings create --service prophy-frontend \
     --domain app.prophy.com --region southamerica-east1
   ```
   Google-managed TLS certificates are provisioned automatically.

2. **GitHub Actions variables** — update:
   - `BACKEND_HOST` → `api.prophy.com`
   - `FRONTEND_HOST` → `app.prophy.com`
   - `OIDC_AUDIENCE` → `https://api.prophy.com`

3. **Re-run CI pipelines** — the backend deploy picks up the new `ALLOWED_HOSTS`,
   `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`; the frontend rebuild
   bakes the new `NEXT_PUBLIC_HOST`.

4. **Update Terraform variables** — in `terraform.tfvars`:
   ```hcl
   backend_run_url   = "https://api.prophy.com"
   backend_run_host  = "api.prophy.com"
   frontend_run_host = "app.prophy.com"
   ```
   Then `terraform apply` to update uptime check URLs and Cloud Scheduler
   targets.

5. **Update `backend/core/settings/prod.py`** — `DJANGO_SETTINGS_MODULE` does
   not need changing, but verify `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`
   reflect the new domains after the CI deploy.
