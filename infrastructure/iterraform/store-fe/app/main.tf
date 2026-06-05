module "storefront_fe" {
  source          = "../../modules/cloud_run"
  name            = "catalog-mx-store"
  project_id      = var.project_id
  region          = var.region
  image           = var.image
  service_account = var.runtime_sa_email
  min_instances   = var.min_instances
  health_path     = "/"
  max_instances   = 10
  memory          = "512Mi"
  env_vars = {
    API_URL = var.api_url
  }
}
