# Run: terraform init -backend-config=environments/{env}/backend.hcl
terraform { backend "gcs" {} }
