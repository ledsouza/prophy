resource "google_artifact_registry_repository" "docker" {
  repository_id = "prophy"
  format        = "DOCKER"
  location      = var.region
  project       = var.project_id
  description   = "Backend and frontend container images for Cloud Run."

  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "keep-recent-10"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  cleanup_policies {
    id     = "delete-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s"
    }
  }

  depends_on = [google_project_service.apis]
}

# Repo-scoped IAM: CI pushes, Cloud Run SAs pull.
resource "google_artifact_registry_repository_iam_member" "ci_writer" {
  project    = var.project_id
  location   = google_artifact_registry_repository.docker.location
  repository = google_artifact_registry_repository.docker.name
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.ci.email}"
}

resource "google_artifact_registry_repository_iam_member" "backend_reader" {
  project    = var.project_id
  location   = google_artifact_registry_repository.docker.location
  repository = google_artifact_registry_repository.docker.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_artifact_registry_repository_iam_member" "frontend_reader" {
  project    = var.project_id
  location   = google_artifact_registry_repository.docker.location
  repository = google_artifact_registry_repository.docker.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.frontend.email}"
}
