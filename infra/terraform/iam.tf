# backend-sa: project-level grants applyable today.
#
# Resource-scoped grants live beside the resource they protect:
#   - roles/storage.objectAdmin on the media bucket  → storage.tf (#199)
#   - roles/secretmanager.secretAccessor per secret  → secrets.tf, cloud_sql.tf (#201)

resource "google_project_iam_member" "backend_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Allows backend-sa to call iam.serviceAccounts.signBlob, which the
# GCS client library uses to generate signed download URLs.
resource "google_service_account_iam_member" "backend_token_creator_self" {
  service_account_id = google_service_account.backend.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.backend.email}"
}

# ci-sa: project-level grants applyable today.
#
# Resource-scoped grants live beside the resource they protect:
#   - roles/artifactregistry.writer on the Docker repo → artifact_registry.tf (#200)
#
# scheduler-sa: resource-scoped grant on the backend Cloud Run service.

resource "google_project_iam_member" "ci_run_admin" {
  project = var.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.ci.email}"
}

resource "google_project_iam_member" "ci_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.ci.email}"
}

# ci-sa must act-as backend-sa and frontend-sa when deploying Cloud Run
# revisions that run under those identities.
resource "google_service_account_iam_member" "ci_act_as_backend" {
  service_account_id = google_service_account.backend.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci.email}"
}

resource "google_service_account_iam_member" "ci_act_as_frontend" {
  service_account_id = google_service_account.frontend.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.ci.email}"
}

# Cloud Run service is not managed by Terraform (deployed by CI), so the
# service name is hardcoded rather than referenced as a resource.
resource "google_cloud_run_v2_service_iam_member" "scheduler_backend_invoker" {
  project  = var.project_id
  location = var.region
  name     = "prophy-backend"
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler.email}"
}
