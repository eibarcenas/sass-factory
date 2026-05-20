variable "project_id" {
  type = string
}

variable "notification_channels" {
  type    = list(string)
  default = []
}

variable "alert_email" {
  type = string
}

variable "error_rate_threshold" {
  type    = number
  default = 0.05
}

variable "latency_threshold_ms" {
  type    = number
  default = 5000
}

variable "min_requests_for_latency_alert" {
  type    = number
  default = 10
}

variable "services" {
  type = list(string)
}
