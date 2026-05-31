resource "google_monitoring_notification_channel" "email_alerts" {
  display_name = "Prophy Alerts Email"
  type         = "email"

  labels = {
    email_address = var.alert_email
  }

  depends_on = [google_project_service.apis]
}

resource "google_monitoring_uptime_check_config" "backend_health" {
  display_name = "Backend health check"
  timeout      = "10s"
  period       = "60s"

  http_check {
    path         = "/api/health/"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.backend_run_host
    }
  }
}

resource "google_monitoring_uptime_check_config" "frontend_health" {
  display_name = "Frontend health check"
  timeout      = "30s"
  period       = "300s"

  http_check {
    path         = "/"
    port         = 443
    use_ssl      = true
    validate_ssl = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.frontend_run_host
    }
  }
}

resource "google_monitoring_alert_policy" "uptime_failures" {
  display_name          = "Prophy uptime check failures"
  combiner              = "OR"
  notification_channels = [google_monitoring_notification_channel.email_alerts.name]

  conditions {
    display_name = "Backend uptime failure"

    condition_threshold {
      filter = join(" AND ", [
        "resource.type = \"uptime_url\"",
        "metric.type = \"monitoring.googleapis.com/uptime_check/check_passed\"",
        "resource.labels.host = \"${var.backend_run_host}\"",
      ])
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.labels.*"]
      }
    }
  }

  conditions {
    display_name = "Frontend uptime failure"

    condition_threshold {
      filter = join(" AND ", [
        "resource.type = \"uptime_url\"",
        "metric.type = \"monitoring.googleapis.com/uptime_check/check_passed\"",
        "resource.labels.host = \"${var.frontend_run_host}\"",
      ])
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1

      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_NEXT_OLDER"
        cross_series_reducer = "REDUCE_COUNT_FALSE"
        group_by_fields      = ["resource.labels.*"]
      }
    }
  }
}

resource "google_monitoring_alert_policy" "backend_5xx" {
  display_name          = "Backend 5xx error rate"
  combiner              = "OR"
  notification_channels = [google_monitoring_notification_channel.email_alerts.name]

  conditions {
    display_name = "Backend 5xx requests elevated"

    condition_threshold {
      filter = join(" AND ", [
        "resource.type = \"cloud_run_revision\"",
        "resource.labels.service_name = \"prophy-backend\"",
        "metric.type = \"run.googleapis.com/request_count\"",
        "metric.labels.response_code_class = \"5xx\"",
      ])
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.labels.service_name"]
      }
    }
  }
}

resource "google_monitoring_alert_policy" "frontend_5xx" {
  display_name          = "Frontend 5xx error rate"
  combiner              = "OR"
  notification_channels = [google_monitoring_notification_channel.email_alerts.name]

  conditions {
    display_name = "Frontend 5xx requests elevated"

    condition_threshold {
      filter = join(" AND ", [
        "resource.type = \"cloud_run_revision\"",
        "resource.labels.service_name = \"prophy-frontend\"",
        "metric.type = \"run.googleapis.com/request_count\"",
        "metric.labels.response_code_class = \"5xx\"",
      ])
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
        group_by_fields      = ["resource.labels.service_name"]
      }
    }
  }
}
