#!/usr/bin/env bash
# Portable, self-contained live test for identity-api auth flows.
#
#   1. boots the Firebase Auth + Firestore emulators in Docker (JDK bundled)
#   2. runs the real identity-api against them, with the dev-auth bypass OFF
#      (DEV_USER_EMAIL unset) so the real Firebase token path is exercised
#   3. runs the black-box verification scenarios
#   4. always tears everything down (containers, network, the app process)
#
# Requires: docker (+ compose), uv, and `uv sync --extra dev` already run in
# apps/identity-api. Nothing is installed on the host; Java lives in the image.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$HERE/../.." && pwd)"   # apps/identity-api
PROJECT=demo-eguru
COMPOSE="docker compose -f $HERE/docker-compose.yml"

port_busy() { ss -ltn 2>/dev/null | grep -q ":$1 "; }

# Pick a free port for the ephemeral app so we never clobber whatever else the
# dev may have on identity-api's canonical 8001 (e.g. another project's
# container). Override the search start with IDENTITY_API_PORT.
start="${IDENTITY_API_PORT:-8011}"
PORT=""
for p in $(seq "$start" "$((start + 30))"); do
  if ! port_busy "$p"; then PORT="$p"; break; fi
done
[ -n "$PORT" ] || { echo "❌ no free port found from $start"; exit 1; }

# Emulator ports are fixed by docker-compose.yml; fail clearly if taken.
for ep in 8080 9099; do
  if port_busy "$ep"; then
    echo "❌ emulator port $ep is in use; free it and retry."; exit 1
  fi
done

cleanup() {
  echo "▶ tearing down…"
  fuser -k "${PORT}/tcp" 2>/dev/null || true
  $COMPOSE down -v 2>/dev/null || true
}
trap cleanup EXIT

echo "▶ starting Firebase emulators (Docker)…"
$COMPOSE up -d --build

echo "▶ waiting for emulators…"
for _ in $(seq 1 90); do
  if curl -sf "http://localhost:8080/" >/dev/null 2>&1 \
     && curl -sf "http://localhost:9099/emulator/v1/projects/$PROJECT/config" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "▶ starting identity-api against emulators (dev bypass OFF)…"
( cd "$API_DIR" && env \
    -u DEV_USER_EMAIL -u GOOGLE_APPLICATION_CREDENTIALS -u GOOGLE_IMPERSONATE_SERVICE_ACCOUNT \
    FIRESTORE_EMULATOR_HOST=localhost:8080 \
    FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
    FIRESTORE_PROJECT_ID=$PROJECT \
    FIREBASE_AUTH_PROJECT_ID=$PROJECT \
    GOOGLE_CLOUD_PROJECT=$PROJECT \
    ENVIRONMENT=test \
    uv run uvicorn main:app --host 127.0.0.1 --port "$PORT" ) &

echo "▶ waiting for identity-api…"
for _ in $(seq 1 60); do
  curl -sf "http://127.0.0.1:$PORT/health" >/dev/null 2>&1 && break
  sleep 1
done

echo "▶ running verification…"
cd "$API_DIR" && env \
  FIRESTORE_EMULATOR_HOST=localhost:8080 \
  FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 \
  GOOGLE_CLOUD_PROJECT=$PROJECT \
  IDENTITY_API_URL="http://127.0.0.1:$PORT" \
  uv run python "$HERE/verify_claims_resolve.py"
