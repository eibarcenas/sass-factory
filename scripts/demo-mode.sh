#!/bin/bash
# demo-mode.sh — Levanta el stack de ventas y expone públicamente con ngrok
# Uso: ./scripts/demo-mode.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NGROK="$HOME/.local/bin/ngrok"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " catalog.mx — Modo Demo (flujo de ventas)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verifica ngrok autenticado
if ! "$NGROK" config check &>/dev/null; then
  echo ""
  echo "⚠️  ngrok no está autenticado."
  echo "   1. Crea cuenta gratis: https://ngrok.com"
  echo "   2. Copia tu authtoken de: https://dashboard.ngrok.com/authtokens"
  echo "   3. Ejecuta: ngrok config add-authtoken TU_TOKEN"
  echo "   4. Vuelve a correr este script"
  exit 1
fi

echo ""
echo "▶ Iniciando admin panel (localhost:3000)..."
cd "$ROOT/apps/admin"
pnpm dev --port 3000 &
ADMIN_PID=$!

echo "▶ Iniciando storefront (localhost:3010)..."
cd "$ROOT/apps/storefront"
pnpm dev --port 3010 &
STOREFRONT_PID=$!

# Esperar que los servicios estén listos
echo ""
echo "⏳ Esperando servicios..."
sleep 8

# Exponer storefront públicamente con ngrok
echo "▶ Exponiendo storefront con ngrok..."
"$NGROK" http 3010 --log=stdout --log-format=json > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
sleep 3

# Extraer URL pública
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || echo "")

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✅ Stack de demos LISTO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " Admin panel (TÚ):    http://localhost:3000"
echo " Storefront (público): ${PUBLIC_URL:-http://localhost:3010}"
echo ""
if [ -n "$PUBLIC_URL" ]; then
  echo " Flujo de ventas:"
  echo " 1. Ve a http://localhost:3000 → genera demo"
  echo " 2. Espera a que aparezca el slug del negocio"
  echo " 3. Comparte: ${PUBLIC_URL}/demo/{slug}"
  echo ""
  echo " Ejemplo de demo listo:"
  echo " ${PUBLIC_URL}/demo/heladeria-pinguino"
fi
echo ""
echo " Ctrl+C para apagar todo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Mantener vivos los procesos
cleanup() {
  echo ""
  echo "Apagando servicios..."
  kill $ADMIN_PID $STOREFRONT_PID $NGROK_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM

wait
