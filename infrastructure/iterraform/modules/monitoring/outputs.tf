output "error_rate_alert_id" { value = google_monitoring_alert_policy.error_rate.id }
output "latency_alert_id"    { value = google_monitoring_alert_policy.latency.id }
output "email_channel_id"    { value = google_monitoring_notification_channel.email.name }
