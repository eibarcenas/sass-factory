.PHONY: dev dev-admin dev-storefront dev-emulator \
        test typecheck lint \
        deploy-demo deploy-storefront \
        up down build-admin rebuild status logs shell clean

export PATH := $(HOME)/.local/bin:$(PATH)

PROJECT_ID  ?= $(GOOGLE_CLOUD_PROJECT)
REGION      ?= us-central1
CLUSTER      = sass-factory
ADMIN_IMAGE  = sass-factory/admin:latest
K8S_DIR      = infrastructure/k8s

## ─── Local development ───────────────────────────────────────────────────────

dev: ## Start admin + storefront locally
	@fuser -k 3000/tcp 2>/dev/null || true
	@fuser -k 3010/tcp 2>/dev/null || true
	@echo ""
	@echo "  ┌──────────────────────────────────────────────────────────┐"
	@echo "  │  catalog.mx — Dev local                                  │"
	@echo "  │  Admin        → http://localhost:3000                    │"
	@echo "  │  Storefront   → http://localhost:3010                    │"
	@echo "  └──────────────────────────────────────────────────────────┘"
	@echo ""
	@cd apps/admin && NUXT_TELEMETRY_DISABLED=1 npx nuxt dev --port 3000 &
	@cd apps/storefront && NUXT_TELEMETRY_DISABLED=1 npx nuxt dev --port 3010 &
	@wait

dev-admin: ## Start only admin panel (localhost:3000)
	cd apps/admin && NUXT_TELEMETRY_DISABLED=1 npx nuxt dev --port 3000

dev-storefront: ## Start only storefront (localhost:3010)
	cd apps/storefront && NUXT_TELEMETRY_DISABLED=1 npx nuxt dev --port 3010

dev-emulator: ## Start admin + Firestore emulator
	@firebase emulators:start --only firestore &
	@sleep 3
	@cd apps/admin && NUXT_TELEMETRY_DISABLED=1 npx nuxt dev --port 3000

## ─── Quality ─────────────────────────────────────────────────────────────────

test: ## Run all unit tests
	pnpm -F @sass-factory/core test

typecheck: ## Type-check all packages
	pnpm -F @sass-factory/core typecheck

lint: ## Lint all packages
	pnpm -r lint --if-present

## ─── Deploy (GCP Cloud Run) ──────────────────────────────────────────────────

deploy-storefront: ## Deploy storefront to Cloud Run (requires GCP auth)
	@[ -n "$(PROJECT_ID)" ] || (echo "❌ Set PROJECT_ID: make deploy-storefront PROJECT_ID=my-project"; exit 1)
	gcloud config set project $(PROJECT_ID) --quiet
	gcloud run deploy sass-factory-storefront \
	  --source apps/storefront \
	  --region $(REGION) \
	  --allow-unauthenticated \
	  --set-env-vars="FIREBASE_PROJECT_ID=$(PROJECT_ID)" \
	  --min-instances=0 \
	  --max-instances=10 \
	  --memory=512Mi \
	  --quiet
	@echo ""
	@echo "✅ Storefront deployed. Share: $$(gcloud run services describe sass-factory-storefront --region $(REGION) --format 'value(status.url)')/demo/{slug}"

deploy-demo: deploy-storefront ## Alias for deploy-storefront

## ─── k8s / kind (local cluster) ─────────────────────────────────────────────

up: ## Start full platform on kind cluster
	@echo ""
	@echo "  ┌──────────────────────────────────────────────────────────┐"
	@echo "  │  SASS Factory (k8s/kind)                                 │"
	@echo "  │  Admin        → http://localhost:4200                    │"
	@echo "  └──────────────────────────────────────────────────────────┘"
	@echo ""
	@kind get clusters 2>/dev/null | grep -q "^$(CLUSTER)$$" || \
	  kind create cluster --config $(K8S_DIR)/kind-config.yaml
	@$(MAKE) build-admin
	@kind load docker-image $(ADMIN_IMAGE) --name $(CLUSTER)
	@kubectl apply -f $(K8S_DIR)/admin-rbac.yaml
	@kubectl apply -f $(K8S_DIR)/admin-deployment.yaml
	@kubectl rollout status deployment/admin --timeout=120s
	@echo "  ✓ Running at http://localhost:4200"

down: ## Stop kind cluster
	@kubectl delete -f $(K8S_DIR)/admin-deployment.yaml --ignore-not-found
	@kind delete cluster --name $(CLUSTER)

build-admin: ## Build admin Docker image
	docker build -t $(ADMIN_IMAGE) -f apps/admin/Dockerfile .

rebuild: build-admin ## Rebuild admin image (no cache) and reload
	docker build --no-cache -t $(ADMIN_IMAGE) -f apps/admin/Dockerfile .
	kind load docker-image $(ADMIN_IMAGE) --name $(CLUSTER)
	kubectl rollout restart deployment/admin

status: ## Show cluster status
	kubectl get deployments,services -n default

logs: ## Follow admin logs
	kubectl logs deployment/admin -f

shell: ## Shell into admin pod
	kubectl exec -it deployment/admin -- sh

clean: ## Remove cluster and images
	kind delete cluster --name $(CLUSTER) 2>/dev/null || true
	docker rmi $(ADMIN_IMAGE) 2>/dev/null || true
