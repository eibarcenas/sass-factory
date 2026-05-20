variable "project_id"              { type = string }
variable "notification_channels"   { type = list(string); default = [] }
variable "alert_email"             { type = string }
# scale-to-zero aware: only alert when error_rate > threshold WITH traffic present
variable "error_rate_threshold"    { type = number; default = 0.05 }
variable "latency_threshold_ms"    { type = number; default = 5000 }
# minimum requests/min to trigger latency alert (avoids cold-start false positives)
variable "min_requests_for_latency_alert" { type = number; default = 10 }
variable "services"                { type = list(string) }
