resource "google_storage_bucket" "media" {
  name     = "prophy-documents-prod"
  location = var.region
  project  = var.project_id

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  # force_destroy left at default (false): refuse to delete a
  # non-empty production media bucket.

  lifecycle_rule {
    action {
      type = "AbortIncompleteMultipartUpload"
    }
    condition {
      age = 7
    }
  }

  depends_on = [google_project_service.apis]
}

# iam.serviceAccountTokenCreator (granted in iam.tf) covers signBlob;
# objectAdmin covers read/write object operations.
resource "google_storage_bucket_iam_member" "backend_object_admin" {
  bucket = google_storage_bucket.media.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.backend.email}"
}
