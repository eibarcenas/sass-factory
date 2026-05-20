#!/bin/bash
# Usage: ./apply.sh [dev|stg|prod]
ENV=${1:-dev}
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

terraform -chdir="$DIR" init \
  -backend-config="environments/${ENV}/backend.hcl" \
  -reconfigure

terraform -chdir="$DIR" plan \
  -var-file="environments/${ENV}/plain.auto.tfvars"

read -p "Apply to ${ENV}? (yes/no): " confirm
if [ "$confirm" = "yes" ]; then
  terraform -chdir="$DIR" apply \
    -var-file="environments/${ENV}/plain.auto.tfvars" \
    -auto-approve
fi
