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

variable "api_url" {
  type = string
}

variable "min_instances" {
  type    = number
  default = 0
}
