.PHONY: help install up down status ports dev dev-admin dev-storefront dev-api \
        test test-unit test-api test-e2e typecheck lint deploy email

SHELL := /bin/bash

service ?= all

PORT_admin-fe              := 3000
PORT_storefront-fe         := 3010
PORT_landing-fe            := 3020
PORT_catalog-api           := 8000
PORT_identity-api          := 8001
PORT_demos-api             := 8002
PORT_prospects-api         := 8003
PORT_notifications-webhook := 8004

SERVICES := admin-fe storefront-fe landing-fe catalog-api identity-api demos-api prospects-api notifications-webhook
API_BASE ?= http://localhost:$(PORT_catalog-api)

help: ## Show available targets
	@echo "Run from repo root: ~/Desktop/erickbarcenas/sass-factory/"
	@echo ""
	@echo "Local dev:"
	@echo "  make up service=landing-fe"
	@echo "  make up service=storefront-fe"
	@echo "  make up service=admin-fe"
	@echo "  make up service=catalog-api"
	@echo "  make up service=all"
	@echo "  make down service=landing-fe"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-20s\033[0m %s\n",$$1,$$2}'

ports: ## Print canonical local ports
	@echo "admin-fe              http://localhost:$(PORT_admin-fe)"
	@echo "storefront-fe         http://localhost:$(PORT_storefront-fe)"
	@echo "landing-fe            http://localhost:$(PORT_landing-fe)"
	@echo "catalog-api           http://localhost:$(PORT_catalog-api)"
	@echo "identity-api          http://localhost:$(PORT_identity-api)"
	@echo "demos-api             http://localhost:$(PORT_demos-api)"
	@echo "prospects-api         http://localhost:$(PORT_prospects-api)"
	@echo "notifications-webhook http://localhost:$(PORT_notifications-webhook)"

## ─── Install ─────────────────────────────────────────────────────────────────

install: ## Install all dependencies
	pnpm install
	@for app in catalog-api identity-api demos-api prospects-api notifications-webhook; do \
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
	      VITE_STOREFRONT_URL=http://localhost:$(PORT_storefront-fe) \
	      VITE_LANDING_URL=http://localhost:$(PORT_landing-fe) \
	      VITE_CATALOG_API_URL=http://localhost:$(PORT_catalog-api) \
	      VITE_IDENTITY_API_URL=http://localhost:$(PORT_identity-api) \
	      VITE_DEMOS_API_URL=http://localhost:$(PORT_demos-api) \
	      VITE_PROSPECTS_API_URL=http://localhost:$(PORT_prospects-api) \
	      npm run dev -- --host 127.0.0.1 ;; \
	  storefront-fe) \
	    fuser -k $(PORT_storefront-fe)/tcp 2>/dev/null || true; \
	    echo "▶ storefront-fe → http://localhost:$(PORT_storefront-fe)"; \
	    cd apps/storefront-fe && \
	      CATALOG_API_URL=http://localhost:$(PORT_catalog-api) \
	      IDENTITY_API_URL=http://localhost:$(PORT_identity-api) \
	      DEMOS_API_URL=http://localhost:$(PORT_demos-api) \
	      PROSPECTS_API_URL=http://localhost:$(PORT_prospects-api) \
	      NEXT_PUBLIC_ADMIN_URL=http://localhost:$(PORT_admin-fe) \
	      NEXT_PUBLIC_CATALOG_API_URL=http://localhost:$(PORT_catalog-api) \
	      NEXT_PUBLIC_IDENTITY_API_URL=http://localhost:$(PORT_identity-api) \
	      NEXT_PUBLIC_API_URL=$(API_BASE) \
	      npm run dev ;; \
	  landing-fe) \
	    fuser -k $(PORT_landing-fe)/tcp 2>/dev/null || true; \
	    echo "▶ landing-fe → http://localhost:$(PORT_landing-fe)"; \
	    cd apps/landing-fe && \
	      NEXT_PUBLIC_ADMIN_URL=http://localhost:$(PORT_admin-fe) \
	      NEXT_PUBLIC_STOREFRONT_URL=http://localhost:$(PORT_storefront-fe) \
	      NEXT_PUBLIC_IDENTITY_API_URL=http://localhost:$(PORT_identity-api) \
	      NEXT_PUBLIC_API_URL=$(API_BASE) \
	      npm run dev ;; \
	  catalog-api) \
	    fuser -k $(PORT_catalog-api)/tcp 2>/dev/null || true; \
	    echo "▶ catalog-api → http://localhost:$(PORT_catalog-api)"; \
	    cd apps/catalog-api && uv run uvicorn main:app --reload --host 127.0.0.1 --port $(PORT_catalog-api) ;; \
	  identity-api) \
	    fuser -k $(PORT_identity-api)/tcp 2>/dev/null || true; \
	    echo "▶ identity-api → http://localhost:$(PORT_identity-api)"; \
	    cd apps/identity-api && uv run uvicorn main:app --reload --host 127.0.0.1 --port $(PORT_identity-api) ;; \
	  demos-api) \
	    fuser -k $(PORT_demos-api)/tcp 2>/dev/null || true; \
	    echo "▶ demos-api → http://localhost:$(PORT_demos-api)"; \
	    cd apps/demos-api && uv run uvicorn main:app --reload --host 127.0.0.1 --port $(PORT_demos-api) ;; \
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
	    $(MAKE) up service=catalog-api & \
	    $(MAKE) up service=identity-api & \
	    $(MAKE) up service=demos-api & \
	    $(MAKE) up service=prospects-api & \
	    $(MAKE) up service=notifications-webhook & \
	    $(MAKE) up service=storefront-fe & \
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
	  storefront-fe) fuser -k $(PORT_storefront-fe)/tcp 2>/dev/null || true ;; \
	  landing-fe) fuser -k $(PORT_landing-fe)/tcp 2>/dev/null || true ;; \
	  catalog-api) fuser -k $(PORT_catalog-api)/tcp 2>/dev/null || true ;; \
	  identity-api) fuser -k $(PORT_identity-api)/tcp 2>/dev/null || true ;; \
	  demos-api) fuser -k $(PORT_demos-api)/tcp 2>/dev/null || true ;; \
	  prospects-api) fuser -k $(PORT_prospects-api)/tcp 2>/dev/null || true ;; \
	  notifications-webhook) fuser -k $(PORT_notifications-webhook)/tcp 2>/dev/null || true ;; \
	  all) for port in $(PORT_admin-fe) $(PORT_storefront-fe) $(PORT_landing-fe) $(PORT_catalog-api) $(PORT_identity-api) $(PORT_demos-api) $(PORT_prospects-api) $(PORT_notifications-webhook); do fuser -k $$port/tcp 2>/dev/null || true; done ;; \
	  *) echo "❌ Unknown service=$(service). Use one of: $(SERVICES) all"; exit 1 ;; \
	esac

status: ## Show local listeners for canonical ports
	@ss -ltnp '( sport = :$(PORT_admin-fe) or sport = :$(PORT_storefront-fe) or sport = :$(PORT_landing-fe) or sport = :$(PORT_catalog-api) or sport = :$(PORT_identity-api) or sport = :$(PORT_demos-api) or sport = :$(PORT_prospects-api) or sport = :$(PORT_notifications-webhook) )' || true

dev: up ## Alias for make up service=all
dev-admin: ## Alias for make up service=admin-fe
	$(MAKE) up service=admin-fe
dev-storefront: ## Alias for make up service=storefront-fe
	$(MAKE) up service=storefront-fe
dev-api: ## Alias for make up service=catalog-api
	$(MAKE) up service=catalog-api

## ─── Quality ─────────────────────────────────────────────────────────────────

test: test-unit test-api ## Run all unit + integration tests

test-unit: ## Run Vitest unit tests
	pnpm -F @eguru/core test
	pnpm -F admin-fe test --if-present

test-api: ## Run catalog-api pytest suite
	cd apps/catalog-api && DEV_USER_EMAIL=dev@test.local ENVIRONMENT=local uv run pytest -q

test-e2e: ## Run Playwright E2E tests
	pnpm exec playwright test

typecheck: ## Type-check JS/TS packages
	pnpm -F @eguru/core typecheck
	pnpm -F admin-fe typecheck
	pnpm -F storefront-fe typecheck
	pnpm -F landing-fe typecheck

lint: ## Lint all packages
	pnpm -r lint --if-present

## ─── Deploy (GCP Cloud Run) ──────────────────────────────────────────────────
## Usage: make deploy service=admin-fe|storefront-fe|landing-fe|catalog-api|identity-api|demos-api|prospects-api|notifications-webhook|all

project-id ?= catalog-mx-dev
region     ?= us-central1

deploy: ## Deploy one canonical service to Cloud Run
	@[ -n "$(service)" ] || (echo "❌ service is required. Usage: make deploy service=admin-fe"; exit 1)
	@if [ "$(service)" = "all" ]; then \
	  for svc in $(SERVICES); do $(MAKE) deploy service=$$svc project-id=$(project-id) region=$(region); done; \
	elif [ "$(service)" = "admin-fe" ] || [ "$(service)" = "storefront-fe" ] || [ "$(service)" = "landing-fe" ] || [ "$(service)" = "catalog-api" ] || [ "$(service)" = "identity-api" ] || [ "$(service)" = "demos-api" ] || [ "$(service)" = "prospects-api" ] || [ "$(service)" = "notifications-webhook" ]; then \
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
