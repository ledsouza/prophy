variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "Default GCP region for all resources."
  type        = string
  default     = "southamerica-east1"
}

variable "db_password" {
  description = "Password for the Cloud SQL 'prophy' database user."
  type        = string
  sensitive   = true
}

variable "backend_image_uri" {
  description = "Full Artifact Registry URI for the backend image (e.g. southamerica-east1-docker.pkg.dev/prophy-497315/prophy/backend:<sha>). Provided by Phase 4 CI at deploy time."
  type        = string
}

variable "backend_run_url" {
  description = "Full backend Cloud Run URL with scheme (e.g. https://prophy-backend-341810477176.southamerica-east1.run.app). Used as the Cloud Scheduler OIDC audience and HTTP target base."
  type        = string
}

variable "alert_email" {
  description = "Email address for Cloud Monitoring alert notifications."
  type        = string
}

variable "backend_run_host" {
  description = "Backend Cloud Run hostname without scheme (e.g. prophy-backend-341810477176.southamerica-east1.run.app). Used for uptime checks."
  type        = string
}

variable "frontend_run_host" {
  description = "Frontend Cloud Run hostname without scheme (e.g. prophy-frontend-341810477176.southamerica-east1.run.app). Used for uptime checks."
  type        = string
}
