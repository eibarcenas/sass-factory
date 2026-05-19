variable "project_id"          { type = string }
variable "billing_account_id"  { type = string }
variable "monthly_limit_usd"   { type = number; default = 40 }
variable "alert_email"         { type = string }

resource "google_billing_budget" "monthly" {
  billing_account = var.billing_account_id
  display_name    = "Monthly Budget Alert"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = tostring(var.monthly_limit_usd)
    }
  }

  threshold_rules {
    threshold_percent = 0.5   # 50% — info
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 0.9   # 90% — warning
    spend_basis       = "CURRENT_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.0   # 100% — critical
    spend_basis       = "CURRENT_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = []
    pubsub_topic                     = google_pubsub_topic.budget_alerts.id
    disable_default_iam_recipients   = false
  }
}

resource "google_pubsub_topic" "budget_alerts" {
  project = var.project_id
  name    = "budget-alerts"
}

output "pubsub_topic" { value = google_pubsub_topic.budget_alerts.id }
