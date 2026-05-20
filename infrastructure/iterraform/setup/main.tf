# ── APIs required by all services ─────────────────────────────────────────────
locals {
  required_apis = [
    "cloudrun.googleapis.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "identitytoolkit.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "billingbudgets.googleapis.com",
    "storage.googleapis.com",
  ]
}

resource "google_project_service" "apis" {
  for_each           = toset(local.required_apis)
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# ── GCS bucket for Terraform state ────────────────────────────────────────────
resource "google_storage_bucket" "tf_state" {
  name                        = var.tf_state_bucket
  project                     = var.project_id
  location                    = "US"
  uniform_bucket_level_access = true
  versioning { enabled = true }
  lifecycle_rule {
    condition { num_newer_versions = 10 }
    action    { type = "Delete" }
  }
}

# ── Firebase project initialization ───────────────────────────────────────────
resource "google_firebase_project" "default" {
  provider = google
  project  = var.project_id
  depends_on = [google_project_service.apis]
}
