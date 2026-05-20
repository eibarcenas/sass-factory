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

variable "tf_state_bucket" {
  type    = string
  default = "catalog-mx-tf-state"
}
