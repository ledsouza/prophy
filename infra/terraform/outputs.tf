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
