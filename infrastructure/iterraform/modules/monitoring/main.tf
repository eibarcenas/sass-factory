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
  service_filter = join(" OR ", [
    for svc in var.services : "resource.labels.service_name=\"${svc}\""
  ])
}

# Alert on absolute 5xx count — scale-to-zero safe
# (ratio metrics require REDUCE_FRACTION_TRUE which doesn't work on DOUBLE)
resource "google_monitoring_alert_policy" "error_rate" {
  project      = var.project_id
  display_name = "5xx errors spike"
  combiner     = "OR"

  conditions {
    display_name = "5xx errors > 10 in 1 hour"
    condition_threshold {
      filter          = <<-EOT
        resource.type = "cloud_run_revision"
        AND (${local.service_filter})
        AND metric.type = "run.googleapis.com/request_count"
        AND metric.labels.response_code_class = "5xx"
      EOT
      duration        = "3600s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10
      aggregations {
        alignment_period   = "3600s"
        per_series_aligner = "ALIGN_SUM"
      }
    }
  }

  notification_channels = local.channels
  alert_strategy { auto_close = "86400s" }
}

# p99 latency alert — only meaningful with traffic (scale-to-zero aware)
resource "google_monitoring_alert_policy" "latency" {
  project      = var.project_id
  display_name = "High p99 latency"
  combiner     = "OR"

  conditions {
    display_name = "p99 latency > ${var.latency_threshold_ms}ms"
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
