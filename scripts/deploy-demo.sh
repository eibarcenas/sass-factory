#!/bin/bash
# deploy-demo.sh — Despliega storefront y admin a Cloud Run para demos de ventas
# Uso: ./scripts/deploy-demo.sh [PROJECT_ID] [REGION]
# Ejemplo: ./scripts/deploy-demo.sh my-gcp-project us-central1

set -e

PROJECT_ID="${1:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${2:-us-central1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ PROJECT_ID requerido"
  echo "   Uso: ./scripts/deploy-demo.sh MY_PROJECT_ID"
  echo "   O: export GOOGLE_CLOUD_PROJECT=MY_PROJECT_ID && ./scripts/deploy-demo.sh"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " catalog.mx — Deploy a Cloud Run"
echo " Proyecto: $PROJECT_ID | Región: $REGION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar autenticación
if ! gcloud auth list --filter=status:ACTIVE --format='value(account)' | grep -q '@'; then
  echo "❌ No autenticado en GCP. Ejecuta: gcloud auth login"
  exit 1
fi

gcloud config set project "$PROJECT_ID" --quiet

echo ""
echo "▶ Desplegando storefront..."
STOREFRONT_URL=$(gcloud run deploy sass-factory-storefront \
  --source "$ROOT/apps/storefront" \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=$PROJECT_ID" \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --quiet \
  --format='value(status.url)' 2>/dev/null || \
  gcloud run services describe sass-factory-storefront \
    --region "$REGION" --format='value(status.url)')

echo "▶ Desplegando admin..."
ADMIN_URL=$(gcloud run deploy sass-factory-admin \
  --source "$ROOT/apps/admin" \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=$PROJECT_ID,NODE_ENV=production" \
  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest,FIREBASE_CLIENT_EMAIL=firebase-client-email:latest,FIREBASE_PRIVATE_KEY=firebase-private-key:latest" \
  --min-instances=0 \
  --max-instances=5 \
  --memory=512Mi \
  --quiet \
  --format='value(status.url)' 2>/dev/null || \
  gcloud run services describe sass-factory-admin \
    --region "$REGION" --format='value(status.url)')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✅ Deploy completo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " Admin panel (genera demos):  $ADMIN_URL"
echo " Storefront (comparte con clientes): $STOREFRONT_URL"
echo ""
echo " Flujo de ventas:"
echo " 1. Abre: $ADMIN_URL"
echo " 2. Genera demo para un negocio específico"
echo " 3. Comparte: $STOREFRONT_URL/demo/{slug}"
echo ""
echo " Demo de ejemplo ya disponible:"
echo " $STOREFRONT_URL/demo/heladeria-pinguino"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
