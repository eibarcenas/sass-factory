#!/usr/bin/env bash
# One-time setup for the SASS Factory GCP service account
# Run this once before deploying the factory to Cloud Run.
set -euo pipefail

PROJECT_ID="${1:?Usage: ./setup.sh <factory-project-id> <org-id> <billing-account>}"
ORG_ID="${2:?}"
BILLING_ACCOUNT="${3:?}"
SA_NAME="sass-factory-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Setting up SASS Factory service account in project: $PROJECT_ID"

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  firebase.googleapis.com \
  --project="$PROJECT_ID"

# Create service account
gcloud iam service-accounts create "$SA_NAME" \
  --display-name="SASS Factory Service Account" \
  --project="$PROJECT_ID" 2>/dev/null || echo "SA already exists"

# Project creator on the org
gcloud organizations add-iam-policy-binding "$ORG_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/resourcemanager.projectCreator"

# Billing admin
gcloud billing accounts add-iam-policy-binding "$BILLING_ACCOUNT" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/billing.admin"

# Cloud Build editor (to trigger builds)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/cloudbuild.builds.editor"

# Storage admin (for Terraform state bucket)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

# Create Terraform state bucket
gsutil mb -p "$PROJECT_ID" "gs://${PROJECT_ID}-tf-state" 2>/dev/null || echo "Bucket already exists"
gsutil versioning set on "gs://${PROJECT_ID}-tf-state"

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set GCP_PROJECT_ID=$PROJECT_ID in apps/admin-fe/.env"
echo "  2. Set TF_STATE_BUCKET=${PROJECT_ID}-tf-state in apps/admin-fe/.env"
echo "  3. Deploy the admin to Cloud Run:"
echo "     gcloud run deploy sass-factory-admin --source apps/admin-fe --region us-central1"
