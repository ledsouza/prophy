# backend-sa: project-level grants applyable today.
#
# Deferred resource-scoped grants (added in the issue that creates
# the target resource):
#   - roles/storage.objectAdmin on the media bucket  → issue #198
#   - roles/secretmanager.secretAccessor per secret  → issue #201

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
# Deferred resource-scoped grants:
#   - roles/artifactregistry.writer on the Docker repo → issue #199
#
# scheduler-sa: no project-level grants needed.
#   - roles/run.invoker on the backend Cloud Run service → Phase 4

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
