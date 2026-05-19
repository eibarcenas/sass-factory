variable "project_id"    { type = string }
variable "services"      { type = list(string) }
variable "alert_email"   { type = string }
variable "slack_webhook" { type = string; default = "" }

resource "google_monitoring_notification_channel" "email" {
  project      = var.project_id
  display_name = "Email Alerts"
  type         = "email"
  labels       = { email_address = var.alert_email }
}

# Error rate > 1% for 5 minutes
resource "google_monitoring_alert_policy" "error_rate" {
  project      = var.project_id
  display_name = "High Error Rate"
  combiner     = "OR"

  conditions {
    display_name = "Error rate > 1%"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class!=\"2xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.01
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
  alert_strategy { auto_close = "86400s" }
}

# p99 latency > 2s for 5 minutes
resource "google_monitoring_alert_policy" "latency" {
  project      = var.project_id
  display_name = "High Latency p99"
  combiner     = "OR"

  conditions {
    display_name = "p99 latency > 2s"
    condition_threshold {
      filter     = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 2000
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_PERCENTILE_99"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
}

output "notification_channel_id" {
  value = google_monitoring_notification_channel.email.name
}
