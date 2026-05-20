# ── IAM — API service account ─────────────────────────────────────────────────
module "api_sa" {
  source       = "../modules/iam"
  project_id   = var.project_id
  account_id   = "catalog-mx-api"
  display_name = "catalog.mx API runtime"
  roles = [
    "roles/datastore.user",
    "roles/storage.objectAdmin",
    "roles/secretmanager.secretAccessor",
    "roles/firebaseauth.admin",
    "roles/monitoring.metricWriter",
  ]
}

# ── Cloud Storage — product images ───────────────────────────────────────────
# Created BEFORE Cloud Run so services can reference the bucket name
module "images_bucket" {
  source      = "../modules/storage"
  project_id  = var.project_id
  bucket_name = "catalog-mx-images"
  location    = "US-CENTRAL1"
  public_read = true
  # Static CORS — avoids circular dependency with Cloud Run URLs
  cors_origins = [
    "https://${var.project_id}.web.app",
    "http://localhost:3000",
    "http://localhost:3010",
  ]
  labels = { env = var.project_id }
}

# ── Cloud Run — API (FastAPI Python) ─────────────────────────────────────────
module "api" {
  source          = "../modules/cloud_run"
  name            = "catalog-mx-api"
  project_id      = var.project_id
  region          = var.region
  image           = var.api_image
  service_account = module.api_sa.service_account_email
  min_instances   = 0
  max_instances   = 5
  memory          = "512Mi"
  env_vars = {
    FIRESTORE_PROJECT_ID = var.project_id
    GCS_BUCKET           = module.images_bucket.bucket_name
    ENVIRONMENT          = "production"
    # CORS set to allow-all in API — fine since Firebase Auth enforces authn
    CORS_ALLOWED_ORIGINS = "*"
  }
  secrets = var.anthropic_api_key != "" ? {
    ANTHROPIC_API_KEY = module.anthropic_secret[0].secret_id
  } : {}
}

# ── Cloud Run — Storefront (Next.js, public) ──────────────────────────────────
module "storefront" {
  source          = "../modules/cloud_run"
  name            = "catalog-mx-storefront"
  project_id      = var.project_id
  region          = var.region
  image           = var.storefront_image
  service_account = module.api_sa.service_account_email
  min_instances   = 0
  max_instances   = 10
  memory          = "512Mi"
  env_vars = {
    # Reference API by known naming pattern — no circular dep
    API_URL = "https://catalog-mx-api-pfwg4b2n2q-uc.a.run.app"
  }
}

# ── Cloud Run — Admin (React SPA, nginx) ──────────────────────────────────────
module "admin" {
  source          = "../modules/cloud_run"
  name            = "catalog-mx-admin"
  project_id      = var.project_id
  region          = var.region
  image           = var.admin_image
  service_account = module.api_sa.service_account_email
  min_instances   = 0
  max_instances   = 5
  memory          = "256Mi"
}

# ── Firestore — already exists, managed via import ───────────────────────────
# terraform import module.firestore.google_firestore_database.this \
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
  accessors   = [module.api_sa.member]
}

module "mp_webhook_secret" {
  count       = var.mp_webhook_secret != "" ? 1 : 0
  source      = "../modules/secret_manager"
  project_id  = var.project_id
  secret_id   = "mp-webhook-secret"
  secret_data = var.mp_webhook_secret
  accessors   = [module.api_sa.member]
}

# ── Budget ────────────────────────────────────────────────────────────────────
# module "budget" {
#   source             = "../modules/budget"
  project_id         = var.project_id
  billing_account_id = var.billing_account_id
  display_name       = "catalog-mx ${var.project_id} monthly"
  monthly_limit_usd  = 40
  alert_thresholds   = [0.5, 0.8, 1.0]
  pubsub_topic_id    = google_pubsub_topic.budget_alerts.id
}

# ── Monitoring ────────────────────────────────────────────────────────────────
module "monitoring" {
  source               = "../modules/monitoring"
  project_id           = var.project_id
  alert_email          = var.alert_email
  services             = ["catalog-mx-storefront", "catalog-mx-admin", "catalog-mx-api"]
  error_rate_threshold = 0.05
  latency_threshold_ms = 5000
}

# NOTE: Budget alert is managed via GCP Console (Billing → Budgets & alerts)
# because google_billing_budget requires Billing Account Administrator role
# which ADC credentials don't have in typical setups.
# Go to: https://console.cloud.google.com/billing/01D723-FAA09C-E568B4/budgets
# Create: $40/month alert at 50%, 80%, 100%
