resource "google_sql_database_instance" "postgres" {
  name             = "prophy-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  deletion_protection = true

  settings {
    edition           = "ENTERPRISE"
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 10
    disk_autoresize   = true

    # Caps automatic disk growth so costs don't spiral on a small dataset.
    disk_autoresize_limit = 20

    ip_configuration {
      ipv4_enabled = true
      # No authorized_networks: only the Cloud SQL Auth Proxy (via
      # --add-cloudsql-instances on Cloud Run, Phase 4) can connect.
    }

    backup_configuration {
      enabled    = true
      start_time = "03:00"
      # PITR disabled — avoids continuous WAL storage cost for a small DB.
      point_in_time_recovery_enabled = false
    }
  }

  depends_on = [google_project_service.apis]
}

resource "google_sql_database" "prophy" {
  name     = "prophy"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "prophy" {
  name     = "prophy"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# Value is Terraform-managed to stay in sync with the Cloud SQL user
# password — both come from var.db_password, so they can never drift.
resource "google_secret_manager_secret" "db_password" {
  secret_id = "postgres-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

resource "google_secret_manager_secret_iam_member" "backend_db_password_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.db_password.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.backend.email}"
}
