# ── GCS — Terraform state bucket ──────────────────────────────────────────────
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
    action { type = "Delete" }
  }
}

# ── GCS — Images bucket ────────────────────────────────────────────────────────
resource "google_storage_bucket" "images" {
  name                        = var.images_bucket
  project                     = var.project_id
  location                    = "US-CENTRAL1"
  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    response_header = ["Content-Type", "Authorization"]
    max_age_seconds = 3600
  }

  lifecycle_rule {
    condition { age = 365 }
    action { type = "Delete" }
  }
}

resource "google_storage_bucket_iam_member" "images_public" {
  bucket = google_storage_bucket.images.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# ── Artifact Registry — Docker repository ─────────────────────────────────────
resource "google_artifact_registry_repository" "docker" {
  project       = var.project_id
  location      = var.region
  repository_id = "catalog-mx"
  format        = "DOCKER"
  description   = "Docker images for catalog.mx services"
}

# ── Service Account — Runtime (API, Storefront) ────────────────────────────────
resource "google_service_account" "api_runtime" {
  project      = var.project_id
  account_id   = "catalog-mx-api"
  display_name = "catalog.mx API runtime"
  description  = "Used by Cloud Run services at runtime"
}

resource "google_project_iam_member" "api_runtime_roles" {
  for_each = toset([
    "roles/datastore.user",
    "roles/storage.objectAdmin",
    "roles/pubsub.publisher",
    "roles/pubsub.subscriber",
    "roles/secretmanager.secretAccessor",
    "roles/firebaseauth.admin",
    "roles/monitoring.metricWriter",
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.api_runtime.email}"
}

resource "google_service_account_iam_member" "api_runtime_token_creator" {
  service_account_id = google_service_account.api_runtime.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.api_runtime.email}"
}

# ── Service Account — Deployer (GitHub Actions CI/CD) ─────────────────────────
resource "google_service_account" "deployer" {
  project      = var.project_id
  account_id   = "catalog-mx-deployer"
  display_name = "catalog.mx GitHub Actions deployer"
  description  = "Impersonated by GitHub Actions via WIF to deploy services"
}

resource "google_project_iam_member" "deployer_roles" {
  for_each = toset([
    "roles/run.admin",
    "roles/iam.serviceAccountUser",           # to set runtime SA on Cloud Run
    "roles/artifactregistry.writer",          # push Docker images
    "roles/storage.admin",                    # read source, push images
    "roles/cloudbuild.builds.editor",         # submit source builds
    "roles/secretmanager.secretVersionAdder", # add secret versions in CI
  ])
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# ── Workload Identity Federation — GitHub Actions ─────────────────────────────
resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "github-pool"
  display_name              = "GitHub Actions pool"
  description               = "WIF pool for GitHub Actions CI/CD"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub provider"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = "assertion.repository == '${var.github_org}/${var.github_repo}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Allow GitHub Actions (any branch of the repo) to impersonate the deployer SA
resource "google_service_account_iam_member" "github_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_org}/${var.github_repo}"
}

# ── Monitoring — notification channel (shared across alert policies) ──────────
resource "google_monitoring_notification_channel" "email" {
  project      = var.project_id
  display_name = "Email — ${var.alert_email}"
  type         = "email"
  labels       = { email_address = var.alert_email }
}
