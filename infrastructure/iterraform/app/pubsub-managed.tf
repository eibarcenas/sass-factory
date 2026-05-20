# Pub/Sub topics managed by the app layer
# budget alerts feed into this topic → could trigger a Cloud Function or alert

resource "google_pubsub_topic" "budget_alerts" {
  name    = "catalog-mx-budget-alerts"
  project = var.project_id

  message_retention_duration = "86600s"
  labels = { managed-by = "terraform-app" }
}

resource "google_pubsub_topic" "prospect_notifications" {
  name    = "catalog-mx-prospect-notifications"
  project = var.project_id
  labels = { managed-by = "terraform-app" }
}
