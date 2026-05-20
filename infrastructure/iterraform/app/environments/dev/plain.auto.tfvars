project_id          = "catalog-mx-dev"
region              = "us-central1"
billing_account_id  = "01D723-FAA09C-E568B4"
alert_email         = "eibarcenas.m@gmail.com"

# Images — updated by CI on each deploy
storefront_image = "us-central1-docker.pkg.dev/catalog-mx-dev/cloud-run-source-deploy/catalog-mx-storefront:latest"
admin_image      = "us-central1-docker.pkg.dev/catalog-mx-dev/cloud-run-source-deploy/catalog-mx-admin:latest"
api_image        = "us-central1-docker.pkg.dev/catalog-mx-dev/cloud-run-source-deploy/catalog-mx-api:latest"
