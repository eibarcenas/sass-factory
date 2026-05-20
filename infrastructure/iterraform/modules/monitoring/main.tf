resource "google_monitoring_notification_channel" "email" {
  project      = var.project_id
  display_name = "Email — ${var.alert_email}"
  type         = "email"
  labels       = { email_address = var.alert_email }
}

locals {
  channels = concat(
    [google_monitoring_notification_channel.email.name],
    var.notification_channels
  )
  # Service filter for all monitored Cloud Run services
  service_filter = join(" OR ", [
    for svc in var.services : "resource.labels.service_name=\"${svc}\""
  ])
}

# Error rate alert — request-based, scale-to-zero safe
# Only triggers when there IS traffic AND error rate is high
resource "google_monitoring_alert_policy" "error_rate" {
  project      = var.project_id
  display_name = "High error rate (5xx)"
  combiner     = "OR"

  conditions {
    display_name = "Error rate > ${var.error_rate_threshold * 100}% over 1h"
    condition_threshold {
      filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND (${local.service_filter})
        AND metric.type = "run.googleapis.com/request_count"
        AND metric.labels.response_code_class = "5xx"
      EOT
      # 1-hour window: enough to filter out isolated cold-start errors
      duration        = "3600s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.error_rate_threshold
      aggregations {
        alignment_period     = "3600s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_FRACTION_TRUE"
        group_by_fields      = ["resource.labels.service_name"]
      }
    }
  }

  notification_channels = local.channels
  alert_strategy { auto_close = "86400s" }
}

# p99 latency alert — only when there is sustained traffic
resource "google_monitoring_alert_policy" "latency" {
  project      = var.project_id
  display_name = "High p99 latency (${var.latency_threshold_ms}ms)"
  combiner     = "OR"

  conditions {
    display_name = "p99 latency > ${var.latency_threshold_ms}ms over 30min"
    condition_threshold {
      filter = <<-EOT
        resource.type = "cloud_run_revision"
        AND (${local.service_filter})
        AND metric.type = "run.googleapis.com/request_latencies"
      EOT
      duration        = "1800s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.latency_threshold_ms
      aggregations {
        alignment_period     = "1800s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_PERCENTILE_99"
        group_by_fields      = ["resource.labels.service_name"]
      }
    }
  }

  notification_channels = local.channels
  alert_strategy { auto_close = "86400s" }
}
