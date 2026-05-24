resource "google_service_account" "backend" {
  account_id   = "backend-sa"
  display_name = "Backend Cloud Run service (Django)"
  project      = var.project_id

  depends_on = [google_project_service.apis]
}

resource "google_service_account" "frontend" {
  account_id   = "frontend-sa"
  display_name = "Frontend Cloud Run service (Next.js)"
  project      = var.project_id

  depends_on = [google_project_service.apis]
}

resource "google_service_account" "scheduler" {
  account_id   = "scheduler-sa"
  display_name = "Cloud Scheduler OIDC invoker"
  project      = var.project_id

  depends_on = [google_project_service.apis]
}

resource "google_service_account" "ci" {
  account_id   = "cicd-sa"
  display_name = "GitHub Actions CI/CD (Workload Identity Federation)"
  project      = var.project_id

  depends_on = [google_project_service.apis]
}
