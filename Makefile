.PHONY: help dev dev-admin dev-storefront dev-api \
        test test-unit test-api test-e2e typecheck lint \
        install \
        deploy-admin deploy-storefront deploy-api deploy-all \
        setup-email check-email \
        up down status logs clean

help: ## Show available targets (run from repo root)
	@echo "Run all targets from the repo root: ~/Desktop/erickbarcenas/sass-factory/"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-20s\033[0m %s\n",$$1,$$2}'

## ─── Install ─────────────────────────────────────────────────────────────────

install: ## Install all dependencies (JS + Python 3.13 via uv)
	pnpm install
	cd apps/api && uv venv --python 3.13
	cd apps/api && uv pip install fastapi "uvicorn[standard]" pydantic pydantic-settings \
	  google-cloud-firestore python-dotenv python-multipart pytest pytest-asyncio httpx

## ─── Local development ───────────────────────────────────────────────────────

dev: ## Start all services locally
	@fuser -k 3000/tcp 3010/tcp 8000/tcp 2>/dev/null || true
	@echo ""
	@echo "  ┌──────────────────────────────────────────────────────────┐"
	@echo "  │  catalog.mx — Dev local                                  │"
	@echo "  │  Admin (React)       → http://localhost:3000             │"
	@echo "  │  Storefront (Next)   → http://localhost:3010             │"
	@echo "  │  API (FastAPI)       → http://localhost:8000             │"
	@echo "  └──────────────────────────────────────────────────────────┘"
	@echo ""
	@cd apps/admin && pnpm dev &
	@cd apps/storefront && pnpm dev &
	@[ -d apps/api ] && (cd apps/api && uvicorn main:app --reload --port 8000) || echo "  ⚠ API not scaffolded yet"
	@wait

dev-admin: ## Start only admin panel (React, localhost:3000)
	@fuser -k 3000/tcp 2>/dev/null || true
	cd apps/admin && pnpm dev

dev-storefront: ## Start only storefront (Next.js, localhost:3010)
	@fuser -k 3010/tcp 2>/dev/null || true
	cd apps/storefront && pnpm dev

dev-api: ## Start only FastAPI (localhost:8000, Python 3.13)
	@fuser -k 8000/tcp 2>/dev/null || true
	cd apps/api && .venv/bin/uvicorn main:app --reload --port 8000

## ─── Quality ─────────────────────────────────────────────────────────────────

test: test-unit test-api ## Run all unit + integration tests

test-unit: ## Run Vitest unit tests (core + admin)
	pnpm -F @catalog-mx/core test
	pnpm -F admin test

test-api: ## Run FastAPI pytest suite
	cd apps/api && DEV_USER_EMAIL=dev@test.local ENVIRONMENT=local .venv/bin/pytest -q

test-e2e: ## Run Playwright E2E tests (requires services running)
	pnpm exec playwright test

typecheck: ## Type-check all JS/TS packages
	pnpm -F @catalog-mx/core typecheck
	@[ -d apps/admin ] && pnpm -F admin typecheck || true
	@[ -d apps/storefront ] && pnpm -F storefront typecheck || true

lint: ## Lint all packages
	pnpm -r lint --if-present

## ─── Deploy (GCP Cloud Run) ──────────────────────────────────────────────────

deploy-admin: ## Deploy React admin to Cloud Run
	@[ -n "$(PROJECT_ID)" ] || (echo "❌ Set PROJECT_ID: make deploy-admin PROJECT_ID=catalog-mx-dev"; exit 1)
	gcloud run deploy catalog-mx-admin \
	  --source apps/admin \
	  --region $(REGION) \
	  --allow-unauthenticated \
	  --min-instances=0 --max-instances=5 --memory=256Mi \
	  --set-build-env-vars="VITE_API_URL=https://catalog-mx-api-105288105956.us-central1.run.app,VITE_STOREFRONT_URL=https://catalog-mx-storefront-105288105956.us-central1.run.app" \
	  --project=$(PROJECT_ID) --quiet
	@echo "✅ Admin: $$(gcloud run services describe catalog-mx-admin --region $(REGION) --project $(PROJECT_ID) --format 'value(status.url)')"

deploy-all: deploy-admin deploy-storefront deploy-api ## Deploy all services to Cloud Run

deploy-storefront: ## Deploy Next.js storefront to Cloud Run
	@[ -n "$(PROJECT_ID)" ] || (echo "❌ Set PROJECT_ID: make deploy-storefront PROJECT_ID=my-project"; exit 1)
	gcloud run deploy catalog-mx-storefront \
	  --source apps/storefront \
	  --region $(REGION) \
	  --allow-unauthenticated \
	  --set-env-vars="FIREBASE_PROJECT_ID=$(PROJECT_ID)" \
	  --min-instances=0 --max-instances=10 --memory=512Mi --quiet

deploy-api: ## Deploy FastAPI to Cloud Run
	@[ -n "$(PROJECT_ID)" ] || (echo "❌ Set PROJECT_ID: make deploy-api PROJECT_ID=my-project"; exit 1)
	gcloud run deploy catalog-mx-api \
	  --source apps/api \
	  --region $(REGION) \
	  --set-secrets="ANTHROPIC_API_KEY=anthropic-api-key:latest" \
	  --min-instances=0 --max-instances=10 --memory=512Mi --quiet

## ─── Setup ───────────────────────────────────────────────────────────────────

setup-email: ## Set GitHub Variables + GCP Secret Manager for SMTP email (run once)
	@bash scripts/setup-email-vars.sh

check-email: ## Verify SMTP config — GitHub Variables + GCP secret status
	@echo ""
	@echo "━━━ GitHub Variables ━━━"
	@gh variable list --repo eibarcenas/sass-factory | grep -E "SMTP|ADMIN_NOTIFY" || echo "  (none set)"
	@echo ""
	@echo "━━━ GCP Secret Manager ━━━"
	@gcloud secrets describe SMTP_PASS --project=ei-catalog-dev 2>/dev/null \
	  && echo "  SMTP_PASS: ✓ exists" \
	  || echo "  SMTP_PASS: ✗ not found — run make setup-email"
	@echo ""

## ─── Vars ────────────────────────────────────────────────────────────────────

PROJECT_ID ?= $(GOOGLE_CLOUD_PROJECT)
REGION     ?= us-central1
