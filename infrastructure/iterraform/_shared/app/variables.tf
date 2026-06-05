variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "billing_account_id" {
  type = string
}

variable "alert_email" {
  type = string
}

# SA emails — created in setup/, referenced here
variable "api_sa_email" {
  type        = string
  description = "email of catalog-mx-stores-api SA. Get from: terraform -chdir=../setup output api_runtime_sa_email"
}

variable "monitoring_channel_id" {
  type        = string
  description = "Monitoring notification channel ID. Get from: terraform -chdir=../setup output monitoring_channel_id"
  default     = ""
}

# Secrets (sensitive — loaded from secrets.auto.tfvars.json via SOPS in CI)
variable "anthropic_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "mp_webhook_secret" {
  type      = string
  sensitive = true
  default   = ""
}
