.PHONY: help install up down status ports dev dev-admin dev-store dev-api \
        test test-unit test-api test-live test-e2e typecheck lint deploy email

SHELL := /bin/bash

service ?= all

PORT_admin-fe             := 3000
PORT_store-fe             := 3010
PORT_landing-fe           := 3020
PORT_stores-api           := 8000
PORT_identity-api         := 8001
PORT_prospects-api        := 8003
PORT_notifications-webhook := 8004
LOCAL_GCP_PROJECT           ?= ei-catalog-dev
LOCAL_API_SERVICE_ACCOUNT   ?= catalog-mx-api@$(LOCAL_GCP_PROJECT).iam.gserviceaccount.com

SERVICES := admin-fe store-fe landing-fe stores-api identity-api prospects-api notifications-webhook
API_BASE ?= http://localhost:$(PORT_stores-api)

help: ## Show available targets
	@echo "Run from repo root: ~/Desktop/erickbarcenas/sass-factory/"
	@echo ""
	@echo "Local dev:"
	@echo "  make up service=landing-fe"
	@echo "  make up service=store-fe"
	@echo "  make up service=admin-fe"
	@echo "  make up service=stores-api"
	@echo "  make up service=all"
	@echo "  make down service=landing-fe"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-20s\033[0m %s\n",$$1,$$2}'

ports: ## Print canonical local ports
	@echo "admin-fe              http://localhost:$(PORT_admin-fe)"
	@echo "store-fe              http://localhost:$(PORT_store-fe)"
	@echo "landing-fe            http://localhost:$(PORT_landing-fe)"
	@echo "stores-api             http://localhost:$(PORT_stores-api)"
	@echo "identity-api          http://localhost:$(PORT_identity-api)"
	@echo "prospects-api         http://localhost:$(PORT_prospects-api)"
	@echo "notifications-webhook http://localhost:$(PORT_notifications-webhook)"

## ─── Install ─────────────────────────────────────────────────────────────────

install: ## Install all dependencies
	pnpm install
	@for app in stores-api identity-api prospects-api notifications-webhook; do \
	  echo "▶ Installing $$app"; \
	  cd "apps/$$app" && uv sync --extra dev && cd ../..; \
	done

## ─── Local development ───────────────────────────────────────────────────────

up: ## Start one service. Usage: make up service=landing-fe
	@case "$(service)" in \
	  admin-fe) \
	    fuser -k $(PORT_admin-fe)/tcp 2>/dev/null || true; \
	    echo "▶ admin-fe → http://localhost:$(PORT_admin-fe)"; \
	    cd apps/admin-fe && \
	      VITE_ADMIN_URL=http://localhost:$(PORT_admin-fe) \
	      VITE_STORE_URL=http://localhost:$(PORT_store-fe) \
	      VITE_LANDING_URL=http://localhost:$(PORT_landing-fe) \
	      VITE_IDENTITY_API_URL=http://localhost:$(PORT_identity-api) \
	      VITE_STORES_API_URL=http://localhost:$(PORT_stores-api) \
	      VITE_PROSPECTS_API_URL=http://localhost:$(PORT_prospects-api) \
	      npm run dev -- --host 127.0.0.1 ;; \
	  store-fe) \
	    fuser -k $(PORT_store-fe)/tcp 2>/dev/null || true; \
	    echo "▶ store-fe → http://localhost:$(PORT_store-fe)"; \
	    cd apps/store-fe && \
	      IDENTITY_API_URL=http://localhost:$(PORT_identity-api) \
	      STORES_API_URL=http://localhost:$(PORT_stores-api) \
	      PROSPECTS_API_URL=http://localhost:$(PORT_prospects-api) \
	      NEXT_PUBLIC_ADMIN_URL=http://localhost:$(PORT_admin-fe) \
	      NEXT_PUBLIC_STORES_API_URL=http://localhost:$(PORT_stores-api) \
	      NEXT_PUBLIC_IDENTITY_API_URL=http://localhost:$(PORT_identity-api) \
	      NEXT_PUBLIC_API_URL=$(API_BASE) \
	      npm run dev ;; \
	  landing-fe) \
	    fuser -k $(PORT_landing-fe)/tcp 2>/dev/null || true; \
	    echo "▶ landing-fe → http://localhost:$(PORT_landing-fe)"; \
	    cd apps/landing-fe && \
	      NEXT_PUBLIC_ADMIN_URL=http://localhost:$(PORT_admin-fe) \
	      NEXT_PUBLIC_STORE_URL=http://localhost:$(PORT_store-fe) \
	      NEXT_PUBLIC_IDENTITY_API_URL=http://localhost:$(PORT_identity-api) \
	      NEXT_PUBLIC_API_URL=$(API_BASE) \
	      npm run dev ;; \
	  identity-api) \
	    fuser -k $(PORT_identity-api)/tcp 2>/dev/null || true; \
	    echo "▶ identity-api → http://localhost:$(PORT_identity-api)"; \
	    cd apps/identity-api && \
	      GOOGLE_APPLICATION_CREDENTIALS= \
	      GOOGLE_IMPERSONATE_SERVICE_ACCOUNT=$(LOCAL_API_SERVICE_ACCOUNT) \
	      DEV_USER_EMAIL= \
	      FIRESTORE_PROJECT_ID=$(LOCAL_GCP_PROJECT) \
	      FIREBASE_AUTH_PROJECT_ID=$(LOCAL_GCP_PROJECT) \
	      uv run uvicorn main:app --reload --host 127.0.0.1 --port $(PORT_identity-api) ;; \
	  stores-api) \
	    fuser -k $(PORT_stores-api)/tcp 2>/dev/null || true; \
	    echo "▶ stores-api → http://localhost:$(PORT_stores-api)"; \
	    cd apps/stores-api && uv run uvicorn main:app --reload --host 127.0.0.1 --port $(PORT_stores-api) ;; \
	  prospects-api) \
	    fuser -k $(PORT_prospects-api)/tcp 2>/dev/null || true; \
	    echo "▶ prospects-api → http://localhost:$(PORT_prospects-api)"; \
	    cd apps/prospects-api && uv run uvicorn main:app --reload --host 127.0.0.1 --port $(PORT_prospects-api) ;; \
	  notifications-webhook) \
	    fuser -k $(PORT_notifications-webhook)/tcp 2>/dev/null || true; \
	    echo "▶ notifications-webhook → http://localhost:$(PORT_notifications-webhook)"; \
	    cd apps/notifications-webhook && uv run uvicorn main:app --reload --host 127.0.0.1 --port $(PORT_notifications-webhook) ;; \
	  all) \
	    echo "▶ Starting all services"; \
	    $(MAKE) up service=identity-api & \
	    $(MAKE) up service=stores-api & \
	    $(MAKE) up service=prospects-api & \
	    $(MAKE) up service=notifications-webhook & \
	    $(MAKE) up service=store-fe & \
	    $(MAKE) up service=landing-fe & \
	    $(MAKE) up service=admin-fe & \
	    wait ;; \
	  *) \
	    echo "❌ Unknown service=$(service)"; \
	    echo "Use one of: $(SERVICES) all"; \
	    exit 1 ;; \
	esac

down: ## Stop one service by canonical port. Usage: make down service=landing-fe
	@case "$(service)" in \
	  admin-fe) fuser -k $(PORT_admin-fe)/tcp 2>/dev/null || true ;; \
	  store-fe) fuser -k $(PORT_store-fe)/tcp 2>/dev/null || true ;; \
	  landing-fe) fuser -k $(PORT_landing-fe)/tcp 2>/dev/null || true ;; \
	  identity-api) fuser -k $(PORT_identity-api)/tcp 2>/dev/null || true ;; \
	  stores-api) fuser -k $(PORT_stores-api)/tcp 2>/dev/null || true ;; \
	  prospects-api) fuser -k $(PORT_prospects-api)/tcp 2>/dev/null || true ;; \
	  notifications-webhook) fuser -k $(PORT_notifications-webhook)/tcp 2>/dev/null || true ;; \
	  all) for port in $(PORT_admin-fe) $(PORT_store-fe) $(PORT_landing-fe) $(PORT_stores-api) $(PORT_identity-api) $(PORT_prospects-api) $(PORT_notifications-webhook); do fuser -k $$port/tcp 2>/dev/null || true; done ;; \
	  *) echo "❌ Unknown service=$(service). Use one of: $(SERVICES) all"; exit 1 ;; \
	esac

status: ## Show local listeners for canonical ports
	@ss -ltnp '( sport = :$(PORT_admin-fe) or sport = :$(PORT_store-fe) or sport = :$(PORT_landing-fe) or sport = :$(PORT_stores-api) or sport = :$(PORT_identity-api) or sport = :$(PORT_prospects-api) or sport = :$(PORT_notifications-webhook) )' || true

dev: up ## Alias for make up service=all
dev-admin: ## Alias for make up service=admin-fe
	$(MAKE) up service=admin-fe
dev-store: ## Alias for make up service=store-fe
	$(MAKE) up service=store-fe
dev-api: ## Alias for make up service=stores-api
	$(MAKE) up service=stores-api

## ─── Quality ─────────────────────────────────────────────────────────────────

test: test-unit test-api ## Run all unit + integration tests

test-unit: ## Run Vitest unit tests
	pnpm -F @eguru/core test
	pnpm -F admin-fe test --if-present

test-api: ## Run stores-api pytest suite
	cd apps/stores-api && DEV_USER_EMAIL=dev@test.local ENVIRONMENT=local uv run pytest -q

test-live: ## Run identity-api live auth verification (Firebase emulators in Docker)
	bash apps/identity-api/test/live/run.sh

test-e2e: ## Run Playwright E2E tests
	pnpm exec playwright test

typecheck: ## Type-check JS/TS packages
	pnpm -F @eguru/core typecheck
	pnpm -F admin-fe typecheck
	pnpm -F store-fe typecheck
	pnpm -F landing-fe typecheck

lint: ## Lint all packages
	pnpm -r lint --if-present

## ─── Deploy (GCP Cloud Run) ──────────────────────────────────────────────────
## Usage: make deploy service=admin-fe|store-fe|landing-fe|stores-api|identity-api|prospects-api|notifications-webhook|all

project-id ?= catalog-mx-dev
region     ?= us-central1

deploy: ## Deploy one canonical service to Cloud Run
	@[ -n "$(service)" ] || (echo "❌ service is required. Usage: make deploy service=admin-fe"; exit 1)
	@if [ "$(service)" = "all" ]; then \
	  for svc in $(SERVICES); do $(MAKE) deploy service=$$svc project-id=$(project-id) region=$(region); done; \
	elif [ "$(service)" = "admin-fe" ] || [ "$(service)" = "store-fe" ] || [ "$(service)" = "landing-fe" ] || [ "$(service)" = "stores-api" ] || [ "$(service)" = "identity-api" ] || [ "$(service)" = "prospects-api" ] || [ "$(service)" = "notifications-webhook" ]; then \
	  echo "▶ Deploying $(service)..."; \
	  gcloud run deploy catalog-mx-$(service)-dev \
	    --source apps/$(service) \
	    --region $(region) \
	    --allow-unauthenticated \
	    --min-instances=0 --max-instances=10 --memory=512Mi \
	    --project=$(project-id) --quiet; \
	  echo "✅ $(service): $$(gcloud run services describe catalog-mx-$(service)-dev --region $(region) --project $(project-id) --format 'value(status.url)')"; \
	else \
	  echo "❌ Unknown service=$(service). Use one of: $(SERVICES) all"; \
	  exit 1; \
	fi

## ─── Setup ───────────────────────────────────────────────────────────────────

email: ## Manage SMTP email config. action=setup|check
	@[ -n "$(action)" ] || (echo "❌ action is required. Usage: make email action=setup|check"; exit 1)
	@if [ "$(action)" = "setup" ]; then \
	  bash scripts/setup-email-vars.sh; \
	elif [ "$(action)" = "check" ]; then \
	  echo ""; \
	  echo "━━━ GitHub Variables ━━━"; \
	  gh variable list --repo eibarcenas/sass-factory | grep -E "SMTP|ADMIN_NOTIFY" || echo "  (none set)"; \
	  echo ""; \
	  echo "━━━ GCP Secret Manager ━━━"; \
	  gcloud secrets describe SMTP_PASS --project=ei-catalog-dev 2>/dev/null \
	    && echo "  SMTP_PASS: ✓ exists" \
	    || echo "  SMTP_PASS: ✗ not found — run: make email action=setup"; \
	  echo ""; \
	else \
	  echo "❌ Unknown action=$(action). Use action=setup or action=check"; \
	  exit 1; \
	fi
