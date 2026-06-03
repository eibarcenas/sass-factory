# Shared app-layer resources. Deployable Cloud Run services live in
# infrastructure/iterraform/<deployable>/app.

# ── Cloud Storage — product images (created in setup, referenced here) ────────
# Import: terraform import module.images_bucket.google_storage_bucket.this catalog-mx-images
module "images_bucket" {
  source       = "../../modules/storage"
  project_id   = var.project_id
  bucket_name  = "catalog-mx-images"
  location     = "US-CENTRAL1"
  public_read  = true
  cors_origins = ["*"]
  labels       = { env = var.project_id }
}

# ── Firestore — database + indexes ────────────────────────────────────────────
# Import: terraform import module.firestore.google_firestore_database.this \
#   projects/${var.project_id}/databases/(default)
module "firestore" {
  source      = "../../modules/firestore"
  project_id  = var.project_id
  location    = var.region
  database_id = "(default)"
}

# ── Secret Manager ────────────────────────────────────────────────────────────
module "anthropic_secret" {
  count       = var.anthropic_api_key != "" ? 1 : 0
  source      = "../../modules/secret_manager"
  project_id  = var.project_id
  secret_id   = "anthropic-api-key"
  secret_data = var.anthropic_api_key
  accessors   = ["serviceAccount:${var.api_sa_email}"]
}

module "mp_webhook_secret" {
  count       = var.mp_webhook_secret != "" ? 1 : 0
  source      = "../../modules/secret_manager"
  project_id  = var.project_id
  secret_id   = "mp-webhook-secret"
  secret_data = var.mp_webhook_secret
  accessors   = ["serviceAccount:${var.api_sa_email}"]
}


# ── Budget ────────────────────────────────────────────────────────────────────
module "budget" {
  source             = "../../modules/budget"
  project_id         = var.project_id
  billing_account_id = var.billing_account_id
  display_name       = "catalog-mx ${var.project_id} monthly"
  monthly_limit_usd  = 40
  alert_thresholds   = [0.5, 0.8, 1.0]
  pubsub_topic_id    = google_pubsub_topic.platform_budget_alert_triggered_v1.id # defined in pubsub-managed.tf
}

# ── Monitoring alert policies ─────────────────────────────────────────────────
module "monitoring" {
  source                = "../../modules/monitoring"
  project_id            = var.project_id
  alert_email           = var.alert_email
  notification_channels = var.monitoring_channel_id != "" ? [var.monitoring_channel_id] : []
  services              = ["catalog-mx-storefront", "catalog-mx-admin", "catalog-mx-catalog-api", "catalog-mx-landing"]
  error_rate_threshold  = 0.05
  latency_threshold_ms  = 5000
}
