.PHONY: help dev dev-admin dev-storefront dev-api \
        test typecheck lint \
        install \
        deploy-storefront deploy-api \
        up down status logs clean

help: ## Show available targets (run from repo root)
	@echo "Run all targets from the repo root: ~/Desktop/erickbarcenas/sass-factory/"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-20s\033[0m %s\n",$$1,$$2}'

## ─── Install ─────────────────────────────────────────────────────────────────

install: ## Install all dependencies (JS + Python venv)
	pnpm install
	python3 -m venv apps/api/.venv
	apps/api/.venv/bin/pip install -q google-cloud-firestore python-dotenv fastapi "uvicorn[standard]" pydantic pytest httpx

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

dev-api: ## Start only FastAPI (localhost:8000)
	@fuser -k 8000/tcp 2>/dev/null || true
	cd apps/api && .venv/bin/uvicorn main:app --reload --port 8000 2>/dev/null || uvicorn main:app --reload --port 8000

## ─── Quality ─────────────────────────────────────────────────────────────────

test: ## Run all tests
	pnpm -F @catalog-mx/core test
	@[ -d apps/api ] && (cd apps/api && pytest) || true

typecheck: ## Type-check all JS/TS packages
	pnpm -F @catalog-mx/core typecheck
	@[ -d apps/admin ] && pnpm -F admin typecheck || true
	@[ -d apps/storefront ] && pnpm -F storefront typecheck || true

lint: ## Lint all packages
	pnpm -r lint --if-present

## ─── Deploy (GCP Cloud Run) ──────────────────────────────────────────────────

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

## ─── Vars ────────────────────────────────────────────────────────────────────

PROJECT_ID ?= $(GOOGLE_CLOUD_PROJECT)
REGION     ?= us-central1
