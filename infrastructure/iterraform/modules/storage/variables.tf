variable "project_id"    { type = string }
variable "bucket_name"   { type = string }
variable "location"      { type = string; default = "US-CENTRAL1" }
variable "public_read"   { type = bool; default = false }
variable "cors_origins"  { type = list(string); default = ["*"] }
variable "lifecycle_age" { type = number; default = 365 }
variable "labels"        { type = map(string); default = {} }
