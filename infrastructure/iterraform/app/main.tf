# SAs are created in setup/ — app/ only references them by email
# Run setup first: cd setup && ./scripts/apply.sh dev
# Then get: terraform -chdir=setup output api_runtime_sa_email

# ── Cloud Storage — product images (created in setup, referenced here) ────────
# Import: terraform import module.images_bucket.google_storage_bucket.this catalog-mx-images
module "images_bucket" {
  source      = "../modules/storage"
  project_id  = var.project_id
  bucket_name = "catalog-mx-images"
  location    = "US-CENTRAL1"
  public_read = true
  cors_origins = ["*"]
  labels      = { env = var.project_id }
}

# ── Cloud Run — API (FastAPI Python) ─────────────────────────────────────────
module "api" {
  source          = "../modules/cloud_run"
  name            = "catalog-mx-api"
  project_id      = var.project_id
  region          = var.region
  image           = var.api_image
  service_account = var.api_sa_email
  min_instances   = 0
  max_instances   = 5
  memory          = "512Mi"
  env_vars = {
    FIRESTORE_PROJECT_ID = var.project_id
    GCS_BUCKET           = module.images_bucket.bucket_name
    ENVIRONMENT          = "production"
    CORS_ALLOWED_ORIGINS = "*"
  }
}

# ── Cloud Run — Storefront (Next.js) ──────────────────────────────────────────
module "storefront" {
  source          = "../modules/cloud_run"
  name            = "catalog-mx-storefront"
  project_id      = var.project_id
  region          = var.region
  image           = var.storefront_image
  service_account = var.api_sa_email
  min_instances   = 0
  max_instances   = 10
  memory          = "512Mi"
  env_vars = {
    API_URL = module.api.url
  }
}

# ── Cloud Run — Admin (React SPA, nginx) ──────────────────────────────────────
module "admin" {
  source          = "../modules/cloud_run"
  name            = "catalog-mx-admin"
  project_id      = var.project_id
  region          = var.region
  image           = var.admin_image
  service_account = var.api_sa_email
  min_instances   = 0
  max_instances   = 5
  memory          = "256Mi"
}

# ── Firestore — database + indexes ────────────────────────────────────────────
# Import: terraform import module.firestore.google_firestore_database.this \
#   projects/${var.project_id}/databases/(default)
module "firestore" {
  source      = "../modules/firestore"
  project_id  = var.project_id
  location    = var.region
  database_id = "(default)"
}

# ── Secret Manager ────────────────────────────────────────────────────────────
module "anthropic_secret" {
  count       = var.anthropic_api_key != "" ? 1 : 0
  source      = "../modules/secret_manager"
  project_id  = var.project_id
  secret_id   = "anthropic-api-key"
  secret_data = var.anthropic_api_key
  accessors   = ["serviceAccount:${var.api_sa_email}"]
}

module "mp_webhook_secret" {
  count       = var.mp_webhook_secret != "" ? 1 : 0
  source      = "../modules/secret_manager"
  project_id  = var.project_id
  secret_id   = "mp-webhook-secret"
  secret_data = var.mp_webhook_secret
  accessors   = ["serviceAccount:${var.api_sa_email}"]
}


# ── Budget ────────────────────────────────────────────────────────────────────
module "budget" {
  source             = "../modules/budget"
  project_id         = var.project_id
  billing_account_id = var.billing_account_id
  display_name       = "catalog-mx ${var.project_id} monthly"
  monthly_limit_usd  = 40
  alert_thresholds   = [0.5, 0.8, 1.0]
  pubsub_topic_id    = google_pubsub_topic.budget_alerts.id  # defined in pubsub-managed.tf
}

# ── Monitoring alert policies ─────────────────────────────────────────────────
module "monitoring" {
  source                = "../modules/monitoring"
  project_id            = var.project_id
  alert_email           = var.alert_email
  notification_channels = var.monitoring_channel_id != "" ? [var.monitoring_channel_id] : []
  services              = ["catalog-mx-storefront", "catalog-mx-admin", "catalog-mx-api"]
  error_rate_threshold  = 0.05
  latency_threshold_ms  = 5000
}
