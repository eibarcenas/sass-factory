# Platform Separation Plan
> Agent-resumable execution plan. Update status as you complete tasks. Never reorder phases.

---

## ⚡ Agent Quick Start

**Before doing anything:**
1. Read the `## Current Status` section — it tells you exactly where to resume.
2. Read the `## Decisions` section — do not re-litigate these, they are final.
3. Read the phase you are resuming — run its verification steps first to confirm prior work is intact.
4. Update task checkboxes (`[ ]` → `[x]`) and `## Current Status` as you complete work.
5. If you hit a blocker, add it to `## Open Blockers` and stop cleanly.

**Token budget running low?** Update `## Current Status` with the exact next task, commit the doc, then stop.

---

## Current Status

```
Phase:       1 — Rename owner→seller
Task:        NOT STARTED
Next action: Create packages/roles/ package (@eguru/roles)
Blocker:     None
```

> Update this block every time you complete a task or phase.

---

## Decisions

These are final. Do not re-open unless marked `[REVISIT]`.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | GitHub org: `eguru` (create free org) | Packages must be scoped to `@eguru/*`; personal username is `eibarcenas` — mismatch with package names. Creating org `eguru` preserves naming without refactoring all imports. |
| 2 | Platform repo: rename `sass-factory` → `platform` after transfer to org | Cleaner IDP naming. Transfer happens in Phase 2. |
| 3 | Product repo: `catalog` (not `catalog-mx`) | User preference. |
| 4 | All repos: private | No public repos. Applies to platform, terraform-modules, github-actions, catalog. |
| 5 | Git history: preserve via `git filter-repo` | Not a fresh start. Filter per-path to split history cleanly. |
| 6 | Rename owner→seller BEFORE splitting repos | Easier in monorepo than coordinating two repos. |
| 7 | Rename SUPER_ADMIN references to "platform" in code (not the Firebase claim value) | Firebase claim `SUPER_ADMIN` stays stable in tokens. Code identifiers and UI labels change to "platform". |
| 8 | Package registry: GitHub Packages under org `eguru` | Free tier, private, integrated with GitHub Actions OIDC. |
| 9 | Versioning: Changesets for `@eguru/*`, multi-semantic-release for `terraform-modules`, semantic-release for `github-actions` and `catalog` | See IDP vision doc for rationale. |
| 10 | Dependabot: configured from day 1 in every repo | npm + GH Actions + pip coverage per repo. |

---

## Target Architecture

```
github.com/eguru/
  platform/              ← was sass-factory; @eguru/* packages + scaffold tools
  terraform-modules/     ← extracted from infrastructure/iterraform/modules/
  github-actions/        ← new reusable workflow repo
  catalog/               ← the product; extracted from sass-factory apps/ + infra
```

### What lives where

```
platform/                          catalog/
──────────────────────────         ───────────────────────────────────
packages/                          apps/
  @eguru/ui                          admin-fe/
  @eguru/core                        storefront-fe/
  @eguru/auth                        landing-fe/
  @eguru/client                      catalog-api/
  @eguru/roles        ← Phase 1      identity-api/
  @eguru/mkt          ← future       demos-api/
tools/                               prospects-api/
  scaffold/           ← future       notifications-webhook/
.changeset/                        infrastructure/
.github/                             terraform/    ← consumes terraform-modules
  workflows/                         cloudbuild/
    release.yml       ← publishes    gcp/
    ci.yml                           k8s/
                                     firestore/
                                   .github/workflows/  ← uses github-actions
                                   app.schema.json     ← new canonical config
                                   Makefile
                                   pnpm-workspace.yaml
                                   .npmrc              ← points to GitHub Packages
```

---

## Phase Dependency Graph

```
Phase 1 (rename)
    ↓
Phase 2 (publish @eguru/*)   ← REQUIRED before Phase 5
    ↓
Phase 3 ──────────┐          ← can run in parallel
Phase 4 ──────────┤
                  ↓
              Phase 5 (extract catalog)
                  ↓
              Phase 6 (clean platform)
```

---

## Phase 1 — Rename owner→seller + create @eguru/roles

**Goal:** Clean up terminology in the monorepo before the code is split into two repos.
**Branch:** `feat/roles-package-seller-rename`
**Scope:** `packages/roles/`, `apps/admin-fe/`, `apps/storefront-fe/`, `packages/core/`

### Context for agent

- Firebase custom claim values (`OWNER`, `SUPER_ADMIN`) must NOT change — they are stored in user tokens and changing them would lock out existing users.
- Only code identifiers, UI labels, route paths, and component/file names change.
- `@eguru/roles` is a new package that makes roles configurable per app. All code uses `ROLES.member.claim` instead of hardcoded `'OWNER'`.
- `packages/core/types/business.ts` has `ownerId`, `ownerEmail`, `ownerApprovedAt` — these map to Firestore field names. Rename them in TypeScript only; the Python API field names are a separate concern.

### Tasks

#### 1.1 Create `@eguru/roles` package

- [ ] Create `packages/roles/` directory
- [ ] Create `packages/roles/package.json`
  ```json
  {
    "name": "@eguru/roles",
    "version": "0.1.0",
    "description": "Role configuration schema for @eguru apps",
    "type": "module",
    "main": "./src/index.ts",
    "module": "./src/index.ts",
    "types": "./src/index.ts",
    "exports": {
      ".": {
        "types": "./src/index.ts",
        "import": "./src/index.ts"
      }
    },
    "scripts": {
      "typecheck": "tsc --noEmit"
    },
    "devDependencies": {
      "typescript": "^5.4.0"
    }
  }
  ```
- [ ] Create `packages/roles/tsconfig.json` (copy from `packages/core/tsconfig.json`)
- [ ] Create `packages/roles/src/index.ts`:
  ```ts
  export interface RoleDefinition {
    claim: string   // Firebase custom claim value — stable, never shown to user
    label: string   // Display name shown in UI
    route: string   // URL route prefix
  }

  export interface AppRoles {
    admin: RoleDefinition    // platform / super-admin role
    member: RoleDefinition   // seller / owner role
  }

  export function createRoles(config: AppRoles): AppRoles {
    return config
  }
  ```
- [ ] Add `@eguru/roles` to `pnpm-workspace.yaml` (it is auto-detected via `packages/*` glob — verify it resolves)
- [ ] Run `pnpm install` to register the new workspace package

#### 1.2 Create roles config in `admin-fe`

- [ ] Create `apps/admin-fe/src/roles.ts`:
  ```ts
  import { createRoles } from '@eguru/roles'

  export const ROLES = createRoles({
    admin: {
      claim: 'SUPER_ADMIN',
      label: 'Platform',
      route: '/dashboard',
    },
    member: {
      claim: 'OWNER',
      label: 'Seller',
      route: '/seller',
    },
  })
  ```
- [ ] Add `"@eguru/roles": "workspace:*"` to `apps/admin-fe/package.json` dependencies

#### 1.3 Rename in `apps/admin-fe/src/`

- [ ] `store/auth.ts`: `UserRole = 'SUPER_ADMIN' | 'OWNER'` → keep claim values, rename mock user email/displayName to seller terminology; replace `'OWNER'` literal with `ROLES.member.claim`
- [ ] `App.tsx`:
  - `RequireOwner` → `RequireSeller`
  - `RequireSuperAdmin` → `RequirePlatform`
  - `OwnerPreviewPage` → `SellerPreviewPage`
  - route `/owner/*` → `/seller/*`
  - route `/owner/preview/:slug` → `/seller/preview/:slug`
  - all `user?.role === 'OWNER'` → `user?.role === ROLES.member.claim`
  - all `user?.role === 'SUPER_ADMIN'` → `user?.role === ROLES.admin.claim`
- [ ] `pages/LoginPage.tsx`: navigate target `/owner` → `ROLES.member.route`
- [ ] `pages/RegisterPage.tsx`: same + `'OWNER'` → `ROLES.member.claim`
- [ ] Rename directory `pages/owner/` → `pages/seller/`
- [ ] Rename file `pages/seller/OwnerDashboardPage.tsx` → `pages/seller/SellerDashboardPage.tsx`
- [ ] Inside `SellerDashboardPage.tsx`: rename `OWNER_NAV` → `SELLER_NAV`, `OwnerDashboardProps` → `SellerDashboardProps`, `OwnerDashboardPage` → `SellerDashboardPage`, text "Acting as owner" → "Acting as seller", text "Previewing as owner" → "Previewing as seller"
- [ ] `hooks/useItems.ts`: `useOwnerItems` → `useSellerItems`, `useOwnerAddItem` → `useSellerAddItem`, `useOwnerUpdateItem` → `useSellerUpdateItem`, `useOwnerDeleteItem` → `useSellerDeleteItem`; update query key `'owner-items'` → `'seller-items'`
- [ ] `infrastructure/api/itemApi.ts`: `ownerList` → `sellerList`, `ownerAdd` → `sellerAdd`, `ownerUpdate` → `sellerUpdate`, `ownerDelete` → `sellerDelete` (keep the `/api/v1/owner/` URL paths unchanged — backend routes are not being renamed)
- [ ] `infrastructure/api/businessApi.ts`: `ownerUpdate` → `sellerUpdate`
- [ ] `components/demos/ProductEditor.tsx`: scope `'owner'` → `'seller'`; update all `useOwner*` calls to `useSeller*`
- [ ] Rename `components/demos/CreateOwnerModal.tsx` → `components/demos/CreateSellerModal.tsx`; update component name, UI text "Activate owner" → "Activate seller", "Owner's Google email" → "Seller's Google email"
- [ ] `components/demos/DemoList.tsx`: update import `CreateOwnerModal` → `CreateSellerModal`, `showOwnerModal` → `showSellerModal`, button text "Activate owner" → "Activate seller"
- [ ] `components/demos/SolicitudesList.tsx`: UI text "Owner aprobó ✓" → "Seller aprobó ✓" (if user-visible); field access `ownerEmail` → `sellerEmail`, `ownerApprovedAt` → `sellerApprovedAt`
- [ ] `pages/DemoDetailPage.tsx`: button label "Act as Owner" → "Act as Seller"; navigate call `/owner` → `ROLES.member.route`; `business.ownerId` → `business.sellerId`
- [ ] `pages/settings/SettingsPage.tsx`: all `user.role === 'OWNER'` → `user.role === ROLES.member.claim`; query key `'owner-business'` → `'seller-business'`
- [ ] `pages/settings/BusinessSection.tsx`: query key update; URL path `/api/v1/owner/business` stays unchanged
- [ ] Update all imports across admin-fe that reference the old file paths

#### 1.4 Rename in `apps/storefront-fe/`

- [ ] Rename `components/OwnerApproveButton.tsx` → `components/SellerApproveButton.tsx`; update component name
- [ ] `components/DemoGate.tsx`: `type Role` literal `'owner'` → `'seller'`; `role === 'OWNER'` → `role === 'SELLER'`; update import `OwnerApproveButton` → `SellerApproveButton`; comment text
- [ ] Update import in any file referencing `OwnerApproveButton`

#### 1.5 Rename in `packages/core/`

- [ ] `src/types/business.ts`: rename fields on `Business` interface:
  - `ownerId` → `sellerId`
  - `ownerEmail` → `sellerEmail`
  - `ownerApprovedAt` → `sellerApprovedAt`

#### 1.6 Verify

- [ ] `pnpm -F @eguru/roles typecheck`
- [ ] `pnpm -F @eguru/core typecheck`
- [ ] `pnpm -F admin-fe typecheck`
- [ ] `pnpm -F storefront-fe typecheck`
- [ ] `pnpm -F landing-fe typecheck`
- [ ] `pnpm -F @eguru/core test`
- [ ] `pnpm -F admin-fe test`
- [ ] No unresolved `'owner'` or `'Owner'` references in `apps/admin-fe/src/` (run: `grep -r "RequireOwner\|OwnerDashboard\|OwnerPreview\|useOwner\|'owner'" apps/admin-fe/src/`)
- [ ] Commit: `feat(roles): add @eguru/roles and rename owner→seller across frontend`
- [ ] PR to `develop` — must include screenshot of seller panel working

---

## Phase 2 — Setup @eguru/* publishing from platform

**Goal:** Publish all `@eguru/*` packages to GitHub Packages before `catalog` can consume them.
**Prerequisite:** Phase 1 complete.

### Tasks

#### 2.1 Create GitHub org `eguru`

- [ ] Go to github.com → New organization → free plan → name: `eguru`
- [ ] Transfer `sass-factory` repo to org `eguru` (Settings → Transfer → eguru/sass-factory)
- [ ] Rename repo `sass-factory` → `platform` (Settings → Repository name)
- [ ] Update local git remote: `git remote set-url origin https://github.com/eguru/platform.git`

#### 2.2 Configure GitHub Packages auth

- [ ] Add `.npmrc` to root of `platform`:
  ```
  @eguru:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
  ```
- [ ] Add `.npmrc` to `.gitignore` for local token (use env var in CI)
- [ ] Verify each `packages/*/package.json` has `"name": "@eguru/..."` and `"publishConfig": { "registry": "https://npm.pkg.github.com" }`

#### 2.3 Configure Changesets (already partially set up)

- [ ] Verify `.changeset/config.json` exists; create if not:
  ```json
  {
    "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
    "changelog": "@changesets/cli/changelog",
    "commit": false,
    "fixed": [],
    "linked": [],
    "access": "restricted",
    "baseBranch": "main",
    "updateInternalDependencies": "patch",
    "ignore": []
  }
  ```
- [ ] Create `.github/workflows/release.yml` in `platform`:
  ```yaml
  name: Release
  on:
    push:
      branches: [main]
  jobs:
    release:
      runs-on: ubuntu-latest
      permissions:
        contents: write
        packages: write
        pull-requests: write
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: pnpm
            registry-url: https://npm.pkg.github.com
        - run: pnpm install --frozen-lockfile
        - uses: changesets/action@v1
          with:
            publish: pnpm changeset publish
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
            NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  ```

#### 2.4 First publish

- [ ] Run `pnpm changeset` → select all packages → `minor` → describe: "Initial publish to GitHub Packages"
- [ ] Run `pnpm changeset version` → bumps all to `0.1.0`
- [ ] Push to `main` → CI publishes all `@eguru/*` packages
- [ ] Verify packages visible at `github.com/eguru/platform/packages`

#### 2.5 Configure Dependabot in `platform`

- [ ] Create `.github/dependabot.yml`:
  ```yaml
  version: 2
  updates:
    - package-ecosystem: npm
      directory: /
      schedule:
        interval: weekly
      ignore:
        - dependency-name: "@eguru/*"  # local workspace packages
    - package-ecosystem: github-actions
      directory: /
      schedule:
        interval: weekly
  ```

#### 2.6 Verify

- [ ] `npm install @eguru/ui@0.1.0` works from a fresh directory with correct `.npmrc` auth
- [ ] All packages installable with a GitHub PAT with `read:packages` scope

---

## Phase 3 — Create `terraform-modules` repo

**Goal:** Extract Terraform modules with git history into a standalone versioned repo.
**Prerequisite:** Phase 2 complete (org `eguru` exists).

### Tasks

- [ ] Clone `platform` to a temp directory: `git clone https://github.com/eguru/platform.git /tmp/tf-modules-extract`
- [ ] Install `git filter-repo`: `pip install git-filter-repo`
- [ ] Run in the temp clone:
  ```bash
  cd /tmp/tf-modules-extract
  git filter-repo --path infrastructure/iterraform/modules/ --path-rename infrastructure/iterraform/modules/:modules/
  ```
- [ ] Create repo `eguru/terraform-modules` on GitHub (private)
- [ ] Add remote and push: `git remote add origin https://github.com/eguru/terraform-modules.git && git push -u origin main`
- [ ] Create `.releaserc.json` for multi-semantic-release (one tag per module subdirectory)
- [ ] Create `.github/workflows/release.yml` using `multi-semantic-release`
- [ ] Create initial tags for each module: `cloud_run-v1.0.0`, `firestore-v1.0.0`, `iam-v1.0.0`, `secret_manager-v1.0.0`, `storage-v1.0.0`, `budget-v1.0.0`, `monitoring-v1.0.0`
- [ ] Configure Dependabot for Terraform providers + GH Actions

#### Verify

- [ ] `git tag` shows all module tags
- [ ] `module "test" { source = "git::https://github.com/eguru/terraform-modules//modules/cloud_run?ref=cloud_run-v1.0.0" }` resolves correctly with a GitHub PAT

---

## Phase 4 — Create `github-actions` repo

**Goal:** Extract reusable workflows so `catalog` CI/CD is DRY.
**Prerequisite:** Phase 2 complete. Can run in parallel with Phase 3.

### Tasks

- [ ] Create repo `eguru/github-actions` on GitHub (private)
- [ ] Create the 5 reusable workflows (based on current deploy workflows in `platform`):
  - `reusable-node-check.yml` (typecheck + lint for frontend apps)
  - `reusable-python-test.yml` (uv + pytest for FastAPI services)
  - `reusable-docker-build.yml` (buildx + GitHub Actions cache + push to Artifact Registry)
  - `reusable-cloud-run-deploy.yml` (GCP OIDC auth + gcloud run deploy + concurrency)
  - `reusable-terraform-deploy.yml` (plan + apply with env approval gate)
- [ ] Tag `v1` on main branch
- [ ] Configure Dependabot for GH Actions

#### Key inputs for `reusable-cloud-run-deploy.yml`
```yaml
inputs:
  service:           string  # e.g. catalog-api
  image_name:        string  # Artifact Registry image path
  cloud_run_service: string  # Cloud Run service name
  environment:       string  # dev | stg | prod
  region:            string
  project:           string
secrets:
  gh_pat: optional
```

#### Verify

- [ ] `uses: eguru/github-actions/.github/workflows/reusable-cloud-run-deploy.yml@v1` resolves in a test workflow
- [ ] Private repo access requires `GITHUB_TOKEN` with `actions: read` on caller repo

---

## Phase 5 — Extract `catalog` product repo

**Goal:** The product lives in its own repo, consumes all `@eguru/*` and infra from external repos.
**Prerequisites:** Phases 2, 3, and 4 complete.

### Tasks

#### 5.1 Extract with `git filter-repo`

- [ ] Clone `platform` to a temp directory: `git clone https://github.com/eguru/platform.git /tmp/catalog-extract`
- [ ] Run in the temp clone:
  ```bash
  cd /tmp/catalog-extract
  git filter-repo \
    --path apps/ \
    --path infrastructure/iterraform/admin-fe/ \
    --path infrastructure/iterraform/catalog-api/ \
    --path infrastructure/iterraform/demos-api/ \
    --path infrastructure/iterraform/identity-api/ \
    --path infrastructure/iterraform/landing-fe/ \
    --path infrastructure/iterraform/notifications-webhook/ \
    --path infrastructure/iterraform/prospects-api/ \
    --path infrastructure/iterraform/storefront-fe/ \
    --path infrastructure/iterraform/_shared/ \
    --path infrastructure/cloudbuild/ \
    --path infrastructure/gcp/ \
    --path infrastructure/k8s/ \
    --path infrastructure/firestore/ \
    --path infrastructure/scripts/ \
    --path Makefile \
    --path .github/workflows/ci.yml \
    --path .github/workflows/deploy-dev-admin-fe.yml \
    --path .github/workflows/deploy-dev-catalog-api.yml \
    --path .github/workflows/deploy-dev-demos-api.yml \
    --path .github/workflows/deploy-dev-identity-api.yml \
    --path .github/workflows/deploy-dev-landing-fe.yml \
    --path .github/workflows/deploy-dev-notifications-webhook.yml \
    --path .github/workflows/deploy-dev-prospects-api.yml \
    --path .github/workflows/deploy-dev-storefront-fe.yml \
    --path .github/workflows/deploy-dev.yml \
    --path .github/workflows/deploy-stg.yml \
    --path .github/workflows/deploy-prod.yml
  ```
- [ ] Create repo `eguru/catalog` on GitHub (private)
- [ ] Push: `git remote add origin https://github.com/eguru/catalog.git && git push -u origin main`

#### 5.2 Update package dependencies

- [ ] Create `pnpm-workspace.yaml` scoped to apps only (no packages/):
  ```yaml
  packages:
    - 'apps/*'
  ```
- [ ] Update each `apps/*/package.json`: replace `"workspace:*"` with published versions:
  - `"@eguru/ui": "^0.1.0"`
  - `"@eguru/core": "^0.1.0"`
  - `"@eguru/auth": "^0.1.0"`
  - `"@eguru/client": "^0.1.0"`
  - `"@eguru/roles": "^0.1.0"`
- [ ] Add root `.npmrc`:
  ```
  @eguru:registry=https://npm.pkg.github.com
  //npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
  ```
- [ ] Add `app.schema.json` at root (see IDP vision doc for schema format)
- [ ] Run `pnpm install` — verify all `@eguru/*` resolve from GitHub Packages

#### 5.3 Update Terraform sources

- [ ] In each `infrastructure/iterraform/*/app/main.tf`, update `source`:
  ```hcl
  # Before
  source = "../../modules/cloud_run"

  # After
  source = "git::https://github.com/eguru/terraform-modules//modules/cloud_run?ref=cloud_run-v1.0.0"
  ```
- [ ] Run `terraform init` in one service to verify module resolution

#### 5.4 Update GitHub Actions workflows

- [ ] Refactor `.github/workflows/deploy-dev-*.yml` to use reusable workflows from `eguru/github-actions@v1`
- [ ] Add concurrency groups to all workflows (was flagged in CI audit)
- [ ] Add path filters to `ci.yml` (was flagged in CI audit)

#### 5.5 Configure Dependabot

- [ ] Create `.github/dependabot.yml`:
  ```yaml
  version: 2
  updates:
    # @eguru/* packages — auto-bump when platform publishes new versions
    - package-ecosystem: npm
      directory: /
      schedule:
        interval: daily
      groups:
        eguru-platform:
          patterns: ["@eguru/*"]
        github-actions-deps:
          patterns: ["@actions/*", "google-github-actions/*", "docker/*", "pnpm/*", "astral-sh/*"]

    # GitHub Actions versions
    - package-ecosystem: github-actions
      directory: /
      schedule:
        interval: weekly

    # Python services
    - package-ecosystem: pip
      directory: /apps/catalog-api
      schedule:
        interval: weekly
    - package-ecosystem: pip
      directory: /apps/identity-api
      schedule:
        interval: weekly
    - package-ecosystem: pip
      directory: /apps/demos-api
      schedule:
        interval: weekly
    - package-ecosystem: pip
      directory: /apps/prospects-api
      schedule:
        interval: weekly
    - package-ecosystem: pip
      directory: /apps/notifications-webhook
      schedule:
        interval: weekly
  ```

#### 5.6 Migrate secrets

- [ ] In GitHub, go to `eguru/catalog` → Settings → Secrets and variables → Actions
- [ ] Add all secrets from `eibarcenas/sass-factory` (or platform):
  - `GH_PAT`
  - `WIF_PROVIDER` (or equivalent GCP OIDC vars)
  - `RUNTIME_SA_DEV`, `RUNTIME_SA_STG`
  - `SMTP_*` vars
  - Firebase config vars
  - GCP project vars
- [ ] Add `PACKAGES_TOKEN` — a GitHub PAT with `read:packages` scope (for installing `@eguru/*` in CI)

#### 5.7 Verify full CI/CD cycle

- [ ] Push a trivial change to `develop` branch in `catalog`
- [ ] Verify CI passes (typecheck, tests)
- [ ] Verify deploy-dev-catalog-api deploys to Cloud Run dev
- [ ] Verify deployed URL responds correctly
- [ ] Check that `@eguru/*` packages installed from GitHub Packages (not local)

---

## Phase 6 — Clean up `platform`

**Goal:** `platform` repo contains only packages and tools. No app code.
**Prerequisite:** Phase 5 fully verified.

### Tasks

- [ ] In `platform`, delete `apps/` directory: `git rm -r apps/`
- [ ] In `platform`, delete `infrastructure/` directory: `git rm -r infrastructure/`
- [ ] In `platform`, delete deploy workflows (keep only `ci.yml` and `release.yml`):
  ```bash
  git rm .github/workflows/deploy-*.yml
  ```
- [ ] Update `pnpm-workspace.yaml` to only include `packages/*` and `tools/*`:
  ```yaml
  packages:
    - 'packages/*'
    - 'tools/*'
  ```
- [ ] Update root `package.json` — remove app-specific scripts
- [ ] Add Dependabot to `platform`:
  ```yaml
  # .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: npm
      directory: /
      schedule:
        interval: weekly
      ignore:
        - dependency-name: "@eguru/*"  # internal workspace
    - package-ecosystem: github-actions
      directory: /
      schedule:
        interval: weekly
  ```
- [ ] Commit: `chore: remove product code — catalog extracted to eguru/catalog`
- [ ] Push to `main`

#### Verify

- [ ] `platform` repo only has `packages/`, `tools/` (empty), `.changeset/`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- [ ] `pnpm -r typecheck` green in `platform`
- [ ] `pnpm -r test` green in `platform`
- [ ] CI in `catalog` still green after `platform` cleanup

---

## Open Blockers

> Add blockers here when you hit them. Include what you tried and what you need.

| # | Blocker | Needs |
|---|---------|-------|
| — | None currently | — |

---

## Backlog (post-separation)

- [ ] `@eguru/mkt` package — extract duplicated marketing components from `storefront-fe` and `landing-fe` (HeroSection, PricingSection, FeaturesSection, LiveCatalogPreview, WhatsAppFAB, GoogleSignInButton)
- [ ] `tools/scaffold` v1 — CLI to generate new app repos from `app.schema.json`
- [ ] `idp-catalog/` repo — service catalog JSON tracking all products, versions, endpoints
- [ ] Migrate `church-finder-15` as first scaffold-generated product
- [ ] Production canary promotion gate (replace `sleep 300` with health gate — flagged in CI audit)
- [ ] Docker layer caching with Buildx (flagged in CI audit)
- [ ] Backend test matrix (flagged in CI audit)

---

## Reference

- IDP vision: `docs/platform-separation-plan.md` (this file) + memory file `project_idp_vision.md`
- CI/CD audit: `docs/ci-cd-audit.md`
- GitHub username: `eibarcenas`
- GitHub org to create: `eguru`
- Current product remote: `https://github.com/eibarcenas/sass-factory`
- Target platform remote: `https://github.com/eguru/platform`
- Target product remote: `https://github.com/eguru/catalog`
