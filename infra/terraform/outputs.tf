output "backend_sa_email" {
  description = "Email of the backend Cloud Run service account."
  value       = google_service_account.backend.email
}

output "frontend_sa_email" {
  description = "Email of the frontend Cloud Run service account."
  value       = google_service_account.frontend.email
}

output "scheduler_sa_email" {
  description = "Email of the Cloud Scheduler invoker service account."
  value       = google_service_account.scheduler.email
}

output "ci_sa_email" {
  description = "Email of the GitHub Actions CI/CD service account."
  value       = google_service_account.ci.email
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name (project:region:instance). Used in --add-cloudsql-instances on Cloud Run."
  value       = google_sql_database_instance.postgres.connection_name
}

output "postgres_socket_host" {
  description = "Value to set as POSTGRES_HOST on Cloud Run (Phase 4). Django/psycopg2 treats a leading '/' as a Unix-socket directory."
  value       = "/cloudsql/${google_sql_database_instance.postgres.connection_name}"
}

output "media_bucket_name" {
  description = "Media uploads bucket name. Set as GCS_BUCKET_NAME on Cloud Run (Phase 4)."
  value       = google_storage_bucket.media.name
}

output "artifact_registry_repository_url" {
  description = "Docker repo URI. Prefix image names with this when pushing/pulling (e.g. <url>/backend:<tag>)."
  value       = "${google_artifact_registry_repository.docker.location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "backend_set_secrets_flag" {
  description = "Value for --set-secrets on the backend Cloud Run deploy (Phase 4 / #209)."
  value = join(",", [
    "DJANGO_SECRET_KEY=${google_secret_manager_secret.django_secret_key.secret_id}:latest",
    "POSTGRES_PASSWORD=${google_secret_manager_secret.db_password.secret_id}:latest",
    "MAILGUN_API_KEY=${google_secret_manager_secret.mailgun_api_key.secret_id}:latest",
  ])
}
