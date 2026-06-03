module "admin_fe" {
  source          = "../../modules/cloud_run"
  name            = "catalog-mx-admin"
  project_id      = var.project_id
  region          = var.region
  image           = var.image
  service_account = var.runtime_sa_email
  min_instances   = var.min_instances
  max_instances   = 5
  memory          = "256Mi"
  health_path     = "/"
}
