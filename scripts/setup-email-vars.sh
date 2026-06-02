#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-email-vars.sh
# Sets GitHub Variables for SMTP config and creates the SMTP_PASS secret
# in Google Secret Manager.
#
# Usage:
#   chmod +x scripts/setup-email-vars.sh
#   ./scripts/setup-email-vars.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REPO="eibarcenas/sass-factory"
GCP_PROJECT="ei-catalog-dev"

echo ""
echo "━━━ catalog.mx — Email setup ━━━"
echo ""

# ── 1. GitHub Variables (non-sensitive) ──────────────────────────────────────

echo "Setting GitHub Variables..."

gh variable set SMTP_HOST          --body "smtp.gmail.com"                        --repo "$REPO"
gh variable set SMTP_PORT          --body "587"                                   --repo "$REPO"
gh variable set SMTP_USER          --body "eibarcenas.m@gmail.com"                --repo "$REPO"
gh variable set SMTP_FROM          --body "catalog.mx <eibarcenas.m@gmail.com>"   --repo "$REPO"
gh variable set ADMIN_NOTIFY_EMAIL --body "eibarcenas.m@gmail.com"                --repo "$REPO"

echo "✓ GitHub Variables set"
echo ""

# ── 2. SMTP_PASS → Google Secret Manager ─────────────────────────────────────

echo "Gmail App Password (16 chars, no spaces):"
echo "  Get it at: myaccount.google.com/apppasswords"
echo ""
read -rsp "  Paste your App Password: " APP_PASS
echo ""

if [ -z "$APP_PASS" ]; then
  echo "✗ No password entered — skipping Secret Manager step"
  exit 1
fi

# Create or update the secret
if gcloud secrets describe SMTP_PASS --project="$GCP_PROJECT" &>/dev/null; then
  echo "$APP_PASS" | gcloud secrets versions add SMTP_PASS \
    --data-file=- \
    --project="$GCP_PROJECT"
  echo "✓ SMTP_PASS secret updated in Secret Manager"
else
  printf '%s' "$APP_PASS" | gcloud secrets create SMTP_PASS \
    --data-file=- \
    --project="$GCP_PROJECT"
  echo "✓ SMTP_PASS secret created in Secret Manager"
fi

# ── 3. Grant the Cloud Run SA access to the secret ───────────────────────────

echo ""
echo "Granting Cloud Run service account access to SMTP_PASS..."

SA=$(gcloud run services describe catalog-mx-api-dev \
  --region=us-central1 \
  --project="$GCP_PROJECT" \
  --format='value(spec.template.spec.serviceAccountName)')

gcloud secrets add-iam-policy-binding SMTP_PASS \
  --member="serviceAccount:${SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --project="$GCP_PROJECT" \
  --quiet

echo "✓ IAM binding set for ${SA}"

# ── Done ──────────────────────────────────────────────────────────────────────

echo ""
echo "━━━ All done ━━━"
echo ""
echo "Next: merge PR #76 → pipeline deploys with email enabled."
echo ""
echo "Verify GitHub Variables:"
echo "  gh variable list --repo $REPO"
echo ""
