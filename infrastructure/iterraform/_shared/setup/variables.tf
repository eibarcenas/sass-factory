variable "project_id" {
  type = string
}

variable "project_number" {
  type        = string
  description = "GCP project number (numeric). Run: gcloud projects describe PROJECT_ID --format='value(projectNumber)'"
}

variable "firebase_auth_project_id" {
  type        = string
  description = "Firebase project that issues ID tokens and accepts custom tokens"
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

variable "images_bucket" {
  type    = string
  default = "catalog-mx-images"
}

variable "github_org" {
  type        = string
  description = "GitHub org or username (e.g. eibarcenas)"
}

variable "github_repo" {
  type        = string
  description = "GitHub repo name (e.g. sass-factory)"
}
