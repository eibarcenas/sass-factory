# Pub/Sub topics managed by the app layer.
# Naming convention:
# - Topics: topic-<domain>-<aggregate>-<fact>-v<version>
# - Subscriptions: sub-<domain>-<aggregate>-<fact>-v<version>-to-<subscriber>

resource "google_pubsub_topic" "platform_budget_alert_triggered_v1" {
  name    = "topic-platform-budget-alert-triggered-v1"
  project = var.project_id

  message_retention_duration = "86600s"
  labels                     = { managed-by = "terraform-shared" }
}

resource "google_pubsub_topic" "catalog_business_status_changed_v1" {
  name    = "topic-catalog-business-status-changed-v1"
  project = var.project_id
  labels  = { managed-by = "terraform-shared" }
}

resource "google_pubsub_topic" "prospects_prospect_created_v1" {
  name    = "topic-prospects-prospect-created-v1"
  project = var.project_id
  labels  = { managed-by = "terraform-shared" }
}

resource "google_pubsub_topic" "stores_store_accepted_v1" {
  name    = "topic-stores-store-accepted-v1"
  project = var.project_id
  labels  = { managed-by = "terraform-shared" }
}
