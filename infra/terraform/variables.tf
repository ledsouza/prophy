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
