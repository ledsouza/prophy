locals {
  enabled_apis = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "cloudscheduler.googleapis.com",
    "monitoring.googleapis.com",
    "compute.googleapis.com",
    "servicenetworking.googleapis.com",
  ])
}

resource "google_project_service" "apis" {
  for_each = local.enabled_apis

  project = var.project_id
  service = each.value

  # Prevents Terraform from disabling the API (and destroying dependent resources)
  # if this resource is ever removed from the configuration.
  disable_on_destroy = false
}
