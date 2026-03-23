variable "factory_project_id" { type = string }
variable "app_project_id"     { type = string }
variable "app_display_name"   { type = string }
variable "app_slug"           { type = string }
variable "org_id"             { type = string }
variable "billing_account"    { type = string }
variable "region"             { type = string  default = "us-central1" }
variable "state_bucket"       { type = string }
