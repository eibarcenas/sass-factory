#!/bin/bash
# deploy-store.sh — Despliega SOLO el storefront a Cloud Run
# El admin corre local — la API key de Anthropic nunca sale de tu máquina
#
# Uso: ./scripts/deploy-store.sh [PROJECT_ID] [REGION]
# Ejemplo: ./scripts/deploy-store.sh my-gcp-project us-central1

set -e

PROJECT_ID="${1:-${GOOGLE_CLOUD_PROJECT:-}}"
REGION="${2:-us-central1}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ PROJECT_ID requerido"
  echo "   Uso: ./scripts/deploy-store.sh MY_PROJECT_ID"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " catalog.mx — Deploy storefront a Cloud Run"
echo " Proyecto: $PROJECT_ID | Región: $REGION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

gcloud config set project "$PROJECT_ID" --quiet

echo ""
echo "▶ Desplegando storefront (solo lectura de Firestore)..."

STORE_URL=$(gcloud run deploy sass-factory-storefront \
  --source "$ROOT/apps/store-fe" \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=$PROJECT_ID" \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --quiet \
  --format='value(status.url)')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✅ Storefront desplegado en Cloud Run"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " Storefront (público): $STORE_URL"
echo ""
echo " Flujo de ventas:"
echo " 1. Corre el admin LOCAL:  pnpm dev:admin"
echo " 2. Genera demo en:        http://localhost:3000"
echo "    (usa tu ANTHROPIC_API_KEY del .env — nunca sale de tu máquina)"
echo " 3. El demo se guarda en Firestore automáticamente"
echo " 4. Comparte con el prospecto:"
echo "    $STORE_URL/store/{slug}"
echo ""
echo " Demo de ejemplo:"
echo " $STORE_URL/store/heladeria-pinguino"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
