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
