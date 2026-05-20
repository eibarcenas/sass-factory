variable "name"            { type = string }
variable "project_id"      { type = string }
variable "region"          { type = string; default = "us-central1" }
variable "image"           { type = string }
variable "service_account" { type = string }
variable "min_instances"   { type = number; default = 0 }
variable "max_instances"   { type = number; default = 10 }
variable "memory"          { type = string; default = "512Mi" }
variable "cpu"             { type = string; default = "1" }
variable "concurrency"     { type = number; default = 80 }
variable "timeout_seconds" { type = number; default = 60 }
variable "allow_public"    { type = bool; default = true }
variable "labels"          { type = map(string); default = {} }
variable "env_vars"        { type = map(string); default = {} }
variable "secrets"         {
  type        = map(string)
  default     = {}
  description = "ENV_VAR_NAME => secret_id in Secret Manager"
}
