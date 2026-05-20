# setup/ — run once per environment by the admin
# Manages infrastructure bootstrap: TF state bucket
# Note: APIs and Firebase are enabled manually or via gcloud
# (google_project_service requires Service Usage Admin role)

# ── GCS bucket for Terraform state ────────────────────────────────────────────
resource "google_storage_bucket" "tf_state" {
  name                        = var.tf_state_bucket
  project                     = var.project_id
  location                    = "US"
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition { num_newer_versions = 10 }
    action    { type = "Delete" }
  }
}
