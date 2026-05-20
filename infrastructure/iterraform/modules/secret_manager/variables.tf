variable "project_id"  { type = string }
variable "secret_id"   { type = string }
variable "secret_data" { type = string; sensitive = true; default = "" }
variable "accessors"   { type = list(string); default = [] }
