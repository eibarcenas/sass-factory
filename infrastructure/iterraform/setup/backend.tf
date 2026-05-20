# Backend config injected at init time via -backend-config=environments/{env}/backend.hcl
# Run: terraform init -backend-config=environments/dev/backend.hcl
terraform { backend "gcs" {} }
