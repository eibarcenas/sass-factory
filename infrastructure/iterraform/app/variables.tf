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

variable "storefront_image" {
  type = string
}

variable "admin_image" {
  type = string
}

variable "api_image" {
  type = string
}

variable "anthropic_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "firebase_sa_key_json" {
  type      = string
  sensitive = true
  default   = ""
}

variable "mp_webhook_secret" {
  type      = string
  sensitive = true
  default   = ""
}
