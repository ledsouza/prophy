resource "google_cloud_run_v2_job" "migrate" {
  name     = "prophy-migrate"
  location = var.region

  depends_on = [google_project_service.apis]

  template {
    template {
      service_account = google_service_account.backend.email

      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.postgres.connection_name]
        }
      }

      containers {
        image   = var.backend_image_uri
        command = ["python", "manage.py", "migrate", "--noinput"]

        env {
          name  = "DJANGO_SETTINGS_MODULE"
          value = "core.settings.migrate"
        }

        env {
          name  = "DATABASE_ENGINE"
          value = "postgres"
        }

        env {
          name  = "POSTGRES_HOST"
          value = "/cloudsql/${google_sql_database_instance.postgres.connection_name}"
        }

        env {
          name  = "POSTGRES_DB"
          value = "prophy"
        }

        env {
          name  = "POSTGRES_USER"
          value = "prophy"
        }

        env {
          name = "DJANGO_SECRET_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.django_secret_key.secret_id
              version = "latest"
            }
          }
        }

        env {
          name = "POSTGRES_PASSWORD"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.db_password.secret_id
              version = "latest"
            }
          }
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }
    }
  }

  # CI updates the image on every deploy via `gcloud run jobs update --image`.
  # Terraform manages structure (env vars, secrets, Cloud SQL mount, SA);
  # CI owns the image tag.
  lifecycle {
    ignore_changes = [template[0].template[0].containers[0].image]
  }
}
