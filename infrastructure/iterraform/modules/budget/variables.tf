variable "project_id" {
  type = string
}

variable "billing_account_id" {
  type = string
}

variable "display_name" {
  type    = string
  default = "Monthly budget"
}

variable "monthly_limit_usd" {
  type    = number
  default = 40
}

variable "alert_thresholds" {
  type        = list(number)
  default     = [0.5, 0.8, 1.0]
  description = "Fractions of budget that trigger alerts (0.5 = 50%)"
}

variable "pubsub_topic_id" {
  type    = string
  default = ""
}
