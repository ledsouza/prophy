resource "google_cloud_scheduler_job" "report_notifications" {
  name             = "prophy-report-notifications"
  description      = "Send due-report notifications to clients (weekdays 08:00 BRT)"
  schedule         = "0 8 * * 1-5"
  time_zone        = "America/Sao_Paulo"
  attempt_deadline = "30s"
  paused           = true

  http_target {
    http_method = "POST"
    uri         = "${var.backend_run_url}/api/reports/tasks/run-report-notifications/"

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = var.backend_run_url
    }
  }

  depends_on = [google_project_service.apis]
}

resource "google_cloud_scheduler_job" "overdue_appointments" {
  name             = "prophy-overdue-appointments"
  description      = "Mark overdue appointments (daily 07:00 BRT)"
  schedule         = "0 7 * * *"
  time_zone        = "America/Sao_Paulo"
  attempt_deadline = "30s"
  paused           = true

  http_target {
    http_method = "POST"
    uri         = "${var.backend_run_url}/api/appointments/tasks/update-overdue/"

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = var.backend_run_url
    }
  }

  depends_on = [google_project_service.apis]
}

resource "google_cloud_scheduler_job" "contract_notifications" {
  name             = "prophy-contract-notifications"
  description      = "Send contract-due notifications (weekdays 08:00 BRT)"
  schedule         = "0 8 * * 1-5"
  time_zone        = "America/Sao_Paulo"
  attempt_deadline = "30s"
  paused           = true

  http_target {
    http_method = "POST"
    uri         = "${var.backend_run_url}/api/proposals/tasks/run-contract-notifications/"

    oidc_token {
      service_account_email = google_service_account.scheduler.email
      audience              = var.backend_run_url
    }
  }

  depends_on = [google_project_service.apis]
}
