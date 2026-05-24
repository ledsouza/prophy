variable "project_id" {
  description = "GCP project ID."
  type        = string
}

variable "region" {
  description = "Default GCP region for all resources."
  type        = string
  default     = "southamerica-east1"
}
