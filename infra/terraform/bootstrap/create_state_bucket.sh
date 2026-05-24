#!/usr/bin/env bash
# Run once to bootstrap the Terraform remote state bucket.
# Requires: gcloud CLI authenticated with roles/storage.admin on the project.
set -euo pipefail

PROJECT_ID="prophy-497315"
BUCKET_NAME="prophy-tfstate"
LOCATION="southamerica-east1"

gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${LOCATION}" \
    --uniform-bucket-level-access

# Versioning lets us recover from accidental state file deletions.
gcloud storage buckets update "gs://${BUCKET_NAME}" \
    --versioning
