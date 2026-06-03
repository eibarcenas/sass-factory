#!/bin/bash
# Usage: ./apply.sh [dev|stg|prod]
ENV=${1:-dev}
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT_IDS=( [dev]="ei-catalog-dev" [stg]="ei-catalog-stg" [prod]="ei-catalog-prod" )
PROJECT="${PROJECT_IDS[$ENV]}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " setup/ apply → ${ENV} (${PROJECT})"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gcloud config set project "$PROJECT" --quiet

terraform -chdir="$DIR" init \
  -backend-config="environments/${ENV}/backend.hcl" \
  -reconfigure

terraform -chdir="$DIR" plan \
  -var-file="environments/${ENV}/plain.auto.tfvars"

read -p "Apply to ${ENV} (${PROJECT})? (yes/no): " confirm
if [ "$confirm" = "yes" ]; then
  terraform -chdir="$DIR" apply \
    -var-file="environments/${ENV}/plain.auto.tfvars" \
    -auto-approve

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " Outputs — copy to GitHub vars:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  terraform -chdir="$DIR" output
fi
