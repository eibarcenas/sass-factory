variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "image" {
  type = string
}

variable "runtime_sa_email" {
  type = string
}

variable "environment" {
  type    = string
  default = "production"
}

variable "admin_notify_email" {
  type    = string
  default = ""
}

variable "smtp_host" {
  type    = string
  default = ""
}

variable "smtp_port" {
  type    = string
  default = "587"
}

variable "smtp_user" {
  type    = string
  default = ""
}

variable "smtp_from" {
  type    = string
  default = ""
}

variable "smtp_pass_secret" {
  type    = string
  default = "smtp-pass"
}

variable "storefront_url" {
  type    = string
  default = "https://catalog.mx"
}

variable "admin_url" {
  type    = string
  default = "https://admin.catalog.mx"
}

variable "min_instances" {
  type    = number
  default = 0
}
