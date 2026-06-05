project_id       = "ei-catalog-prod"
region           = "us-central1"
runtime_sa_email = "ei-stores-api@ei-catalog-prod.iam.gserviceaccount.com"
images_bucket    = "ei-catalog-images-prod"
environment      = "production"
min_instances    = 1
image            = "us-central1-docker.pkg.dev/ei-catalog-prod/ei-catalog/catalog-mx-stores-api:latest"
