# Sprint 5 — Dashboard del Dueño del Negocio

## Overview

| Field | Value |
|---|---|
| Branch | `sprint/5-owner-dashboard` from `develop` |
| Duration | 1.5 weeks |
| Agents | `catalog-mf-agent` + `appearance-mf-agent` (parallel) |
| Initiatives | Business Catalog (E9, E10) |
| Pre-condition | Sprint 4 merged to `develop` |

## Objective

Build the dashboard a business owner uses after their account is activated. This covers three workstreams: the mandatory onboarding flow (first login only), product and category management via the Catalog MFE, and theme/brand customization via the Appearance MFE.

---

## New MFE Remotes

| App | Path | Port (dev) | Exposed as |
|---|---|---|---|
| Catalog MFE | `apps/mfe/catalog` | 3020 | `catalog` in Module Federation |
| Appearance MFE | `apps/mfe/appearance` | 3021 | `appearance` in Module Federation |

Both remotes are lazy-loaded by `apps/admin` (the shell) via `@nuxt/mf` and are rendered only inside authenticated owner routes (`/owner/*`).

---

## Architecture Decisions

- Catalog MFE and Appearance MFE run as independent Nuxt 4 apps with Module Federation.
- Each MFE has its own `nuxt.config.ts` with `moduleFederation.exposes`.
- State between MFEs is shared only through Firestore (no cross-MFE Pinia stores).
- Onboarding state is persisted in Firestore under `businesses/{id}.onboardingStep` (0 | 1 | 2 | 3, where 3 = complete).
- Live preview iframe in Appearance MFE uses `postMessage` to push theme tokens into the preview without a round-trip.
- Plan limits are checked server-side (Nitro route handler), not only in UI.

---

## Onboarding Flow

The onboarding flow is shown on first login (when `business.onboardingStep < 3`) and cannot be skipped. It replaces the normal dashboard until completed.

### Step 1 — Customize Your Store

**File:** `apps/mfe/appearance/app/pages/onboarding/step-1.vue`

- Primary color picker (hex input + color swatch grid with 12 presets)
- Logo upload (drag-and-drop or file input; max 2MB, JPEG/PNG/WebP)
- Tagline input (plain text, max 120 chars, character counter shown)
- Live preview iframe on the right half of the screen (refreshes via `postMessage` on every change)
- "Continuar" button saves draft to Firestore and advances to `onboardingStep = 1`

### Step 2 — Your First Product

**File:** `apps/mfe/catalog/app/pages/onboarding/step-2.vue`

- Product name (required, max 80 chars)
- Price (required, numeric, min 0, currency displayed as MXN)
- Photo (optional, same rules as logo upload)
- Category (optional, free-text or select from existing)
- "Publicar Producto" button creates the item via `POST /api/owner/items` and advances to `onboardingStep = 2`
- This step cannot be reached if Step 1 is not complete (server guard + redirect)

### Step 3 — Share Your Store

**File:** `apps/admin/app/pages/onboarding/step-3.vue`

- Display the public URL (`catalog.mx/{slug}`)
- "Copiar enlace" button (Clipboard API)
- "Compartir en WhatsApp" button (`https://wa.me/?text=...` deep link)
- "Ir a mi panel" button sets `onboardingStep = 3` in Firestore and redirects to `/owner/dashboard`

### Onboarding Guard

**File:** `apps/admin/app/middleware/onboarding.global.ts`

```ts
// Pseudo-logic — implement with composable useOwnerBusiness()
if (route.path.startsWith('/owner') && !route.path.startsWith('/owner/onboarding')) {
  if (business.onboardingStep < 3) {
    return navigateTo(`/owner/onboarding/step-${business.onboardingStep + 1}`)
  }
}
```

---

## Catalog MFE

### Directory Structure

```
apps/mfe/catalog/
  app/
    pages/
      onboarding/
        step-2.vue
      products/
        index.vue          ← product list with drag-to-reorder
        _new.vue           ← add product modal trigger
    components/
      ProductList.vue      ← draggable list (uses @vueuse/gesture or native HTML5 drag)
      ProductCard.vue      ← single product row (name, price, photo thumb, visible toggle)
      ProductModal.vue     ← add / edit product form
      CategorySidebar.vue  ← category list + CRUD
      ProductSearch.vue    ← search/filter input
    composables/
      useProducts.ts       ← Firestore real-time listener for owner's items
      useCategories.ts     ← Firestore listener for owner's categories
      usePlanLimits.ts     ← reads plan from business doc, exposes `canAddProduct`
    server/               ← (none — API lives in apps/admin/server)
  nuxt.config.ts
  package.json
```

### Product List Features

- Rendered with a `<TransitionGroup>` for reorder animations.
- Drag handles on the left of each `ProductCard`.
- On drop, optimistic UI update + `PATCH /api/owner/items/order` with the full reordered array.
- Visible toggle is an immediate Firestore write via `PATCH /api/owner/items/{id}/visibility`; storefront will reflect it within 60s (ISR cache TTL).
- Inline edit opens `ProductModal` in edit mode with existing values pre-filled.

### Add Product Modal (`ProductModal.vue`)

Fields:
- `name` — text, required, max 80 chars
- `price` — number, required, `min=0`, displayed with `$` prefix
- `image` — file input, optional, same security rules as logo
- `category` — select (from `useCategories()`) or free-type to create new
- `visible` — toggle, default `true`

On submit:
1. Client validates required fields.
2. If image is present, upload via `POST /api/owner/logo` (multipart). Receive signed URL.
3. `POST /api/owner/items` with all fields + imageUrl.
4. If response is `403 PLAN_LIMIT_REACHED`, show upgrade modal instead of closing.

### Category CRUD

- **Create:** inline form at bottom of `CategorySidebar`, `POST /api/owner/categories`
- **Rename:** click category name → inline edit → `PATCH /api/owner/categories/{id}`
- **Reorder:** drag in sidebar → `PATCH /api/owner/categories/order`
- **Delete:** trash icon → confirmation → `DELETE /api/owner/categories/{id}` (products in category become uncategorized, not deleted)

### Plan Limits (UI enforcement — server is authoritative)

`usePlanLimits.ts` reads `business.plan` and current item count. When `canAddProduct` is `false`:
- "Agregar Producto" button is disabled with tooltip "Alcanzaste el límite de tu plan".
- If server returns `403 PLAN_LIMIT_REACHED`, `UpgradeModal.vue` is shown regardless of UI state.

---

## Appearance MFE

### Directory Structure

```
apps/mfe/appearance/
  app/
    pages/
      onboarding/
        step-1.vue
      theme/
        index.vue          ← main editor
    components/
      ColorPicker.vue      ← hex input + 12 preset swatches
      LogoUpload.vue       ← drag-and-drop + file validation
      TaglineInput.vue     ← textarea with char counter
      FontSelector.vue     ← grid of 10 font previews
      ThemePreview.vue     ← iframe wrapping storefront preview URL
    composables/
      useTheme.ts          ← read/write theme from Firestore
      useLogoUpload.ts     ← multipart upload + validation
    utils/
      generateTheme.ts     ← algorithm: primary color → full token set
  nuxt.config.ts
  package.json
```

### Color Algorithm (`generateTheme.ts`)

Input: `primaryHex` (e.g. `#E63946`)

Output token set:
- `--color-primary` = input
- `--color-primary-light` = lighten 20%
- `--color-primary-dark` = darken 20%
- `--color-surface` = derived neutral (desaturated, light)
- `--color-on-primary` = white or black (WCAG AA contrast check)
- All tokens written to `packages/tokens/src/generated/{businessId}.css` at save time (or applied inline in preview)

### Live Preview

`ThemePreview.vue` renders an `<iframe>` pointing to `storefront-preview.catalog.mx/{slug}?preview=1`.

On every theme change (debounced 200ms):
```ts
previewIframe.contentWindow.postMessage({ type: 'THEME_UPDATE', tokens }, '*')
```

The storefront preview page listens for `THEME_UPDATE` and applies tokens to `:root` inline.

### Logo Upload Flow

1. User selects file → client checks `file.size <= 2_097_152` and `file.type` in `['image/jpeg', 'image/png', 'image/webp']`.
2. If invalid, show error inline (no upload attempt).
3. If valid, `POST /api/owner/logo` as `multipart/form-data`.
4. Server reads MIME magic bytes (not Content-Type header) and rejects SVG/other.
5. Server resizes to max 1200px width (preserving aspect ratio) using `sharp`.
6. Stores in `gs://catalog-logos/{businessId}/{timestamp}.webp` (always converted to WebP at rest).
7. Returns `{ url: 'https://storage.googleapis.com/...' }`.
8. Client updates preview iframe and saves URL to Firestore.

---

## API Endpoints

All endpoints under `/api/owner/*` require Firebase Auth token (`Authorization: Bearer {idToken}`) with `role === 'owner'`. Nitro middleware `apps/admin/server/middleware/auth.ts` validates the token and attaches `event.context.user`.

### Business

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/owner/business` | Returns the authenticated owner's business document |
| `PATCH` | `/api/owner/business` | Updates `theme`, `tagline`, `onboardingStep` |

**GET `/api/owner/business` response:**
```json
{
  "id": "slug-123",
  "slug": "tacos-el-gordo",
  "name": "Tacos El Gordo",
  "plan": "free",
  "onboardingStep": 2,
  "theme": { "primaryColor": "#E63946", "font": "Inter" },
  "tagline": "Los mejores tacos de la colonia",
  "logoUrl": "https://storage.googleapis.com/..."
}
```

### Items

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/owner/items` | Create item (checks plan limit) |
| `PATCH` | `/api/owner/items/{id}` | Update name, price, image, category |
| `DELETE` | `/api/owner/items/{id}` | Soft delete (`visible = false`, `deletedAt = now`) |
| `PATCH` | `/api/owner/items/{id}/visibility` | Toggle `visible` field |
| `PATCH` | `/api/owner/items/order` | Bulk reorder `[{ id, order }]` |

**POST `/api/owner/items` — plan limit error response (HTTP 403):**
```json
{
  "error": "PLAN_LIMIT_REACHED",
  "limit": 10,
  "current": 10,
  "upgradeUrl": "/owner/billing/upgrade"
}
```

### Categories

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/owner/categories` | List all categories for this business |
| `POST` | `/api/owner/categories` | Create category (`name`, `order`) |
| `PATCH` | `/api/owner/categories/{id}` | Update name or order |
| `DELETE` | `/api/owner/categories/{id}` | Delete (products become uncategorized) |
| `PATCH` | `/api/owner/categories/order` | Bulk reorder `[{ id, order }]` |

### Logo Upload

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/owner/logo` | Multipart upload → Cloud Storage → returns URL |

**POST `/api/owner/logo` — security checks (server-side, `apps/admin/server/api/owner/logo.post.ts`):**
```ts
// 1. Read first 12 bytes — check magic bytes
const magicBytes = buffer.slice(0, 12)
const isJpeg = magicBytes[0] === 0xFF && magicBytes[1] === 0xD8
const isPng = magicBytes.slice(0, 8).equals(PNG_MAGIC)
const isWebP = magicBytes.slice(8, 12).toString() === 'WEBP'
if (!isJpeg && !isPng && !isWebP) {
  throw createError({ statusCode: 415, message: 'UNSUPPORTED_IMAGE_TYPE' })
}
// 2. Resize with sharp
// 3. Upload to Cloud Storage
// 4. Return signed URL
```

---

## File Map

```
apps/admin/
  app/
    middleware/
      onboarding.global.ts          ← redirect guard
    pages/
      owner/
        dashboard.vue               ← main dashboard (post-onboarding)
        onboarding/
          step-3.vue                ← share step
  server/
    api/
      owner/
        business.get.ts
        business.patch.ts
        items.post.ts
        items/
          [id].patch.ts
          [id].delete.ts
          [id]/
            visibility.patch.ts
          order.patch.ts
        categories.get.ts
        categories.post.ts
        categories/
          [id].patch.ts
          [id].delete.ts
          order.patch.ts
        logo.post.ts
    middleware/
      auth.ts                       ← Firebase token validation
    utils/
      plan-limits.ts                ← PLAN_LIMITS constant + check helper

apps/mfe/catalog/
  app/
    pages/
      onboarding/step-2.vue
      products/index.vue
    components/
      ProductList.vue
      ProductCard.vue
      ProductModal.vue
      CategorySidebar.vue
      ProductSearch.vue
    composables/
      useProducts.ts
      useCategories.ts
      usePlanLimits.ts
  nuxt.config.ts
  package.json

apps/mfe/appearance/
  app/
    pages/
      onboarding/step-1.vue
      theme/index.vue
    components/
      ColorPicker.vue
      LogoUpload.vue
      TaglineInput.vue
      FontSelector.vue
      ThemePreview.vue
    composables/
      useTheme.ts
      useLogoUpload.ts
    utils/
      generateTheme.ts
  nuxt.config.ts
  package.json

packages/core/src/
  types/
    app.ts                          ← add OnboardingStep, PlanLimits types
  utils/
    plan-limits.ts                  ← PLAN_LIMITS constant (imported by server)
```

---

## Tasks

### Setup (both agents, day 1)

- [ ] Create `apps/mfe/catalog` with `nuxt.config.ts` and Module Federation config exposing `./ProductsPage`
- [ ] Create `apps/mfe/appearance` with `nuxt.config.ts` and Module Federation config exposing `./ThemePage`
- [ ] Add both MFEs to `pnpm-workspace.yaml`
- [ ] Add `"catalog": "http://localhost:3020/mf-manifest.json"` and `"appearance"` to `apps/admin/nuxt.config.ts` remotes
- [ ] Add `OnboardingStep` and `PlanLimits` types to `packages/core/src/types/app.ts`
- [ ] Add `PLAN_LIMITS` constant to `packages/core/src/utils/plan-limits.ts`:
  ```ts
  export const PLAN_LIMITS = {
    free: { maxItems: 10 },
    pro: { maxItems: 100 },
    growth: { maxItems: Infinity },
  } as const
  ```

### Catalog MFE Agent Tasks

- [ ] Write failing test: `ProductModal` emits `submit` with required fields
- [ ] Implement `ProductModal.vue` with validation
- [ ] Write failing test: `usePlanLimits` returns `canAddProduct = false` when at limit
- [ ] Implement `usePlanLimits.ts`
- [ ] Write failing test: `POST /api/owner/items` returns `403 PLAN_LIMIT_REACHED` when at limit
- [ ] Implement `apps/admin/server/api/owner/items.post.ts` with plan check
- [ ] Write failing test: `PATCH /api/owner/items/order` updates `order` field for each item
- [ ] Implement drag-to-reorder in `ProductList.vue` + `order.patch.ts`
- [ ] Write failing test: `DELETE /api/owner/items/{id}` sets `visible=false` and `deletedAt`
- [ ] Implement soft delete
- [ ] Write failing test: `PATCH /api/owner/items/{id}/visibility` flips `visible`
- [ ] Implement visibility toggle
- [ ] Implement Category CRUD (GET/POST/PATCH/DELETE + order)
- [ ] Implement `ProductSearch.vue` (client-side filter by name and category)
- [ ] Write failing test: `onboarding/step-2.vue` requires name and price before enabling submit
- [ ] Implement `step-2.vue`

### Appearance MFE Agent Tasks

- [ ] Write failing test: `generateTheme('#E63946')` returns token set with correct contrast ratio for `--color-on-primary`
- [ ] Implement `generateTheme.ts`
- [ ] Write failing test: `LogoUpload.vue` emits `error` when file exceeds 2MB
- [ ] Implement `LogoUpload.vue` with client-side validation
- [ ] Write failing test: `POST /api/owner/logo` rejects files without valid magic bytes
- [ ] Implement `logo.post.ts` with magic bytes check + sharp resize
- [ ] Write failing test: `ThemePreview.vue` calls `postMessage` within 500ms of color change
- [ ] Implement `ThemePreview.vue` with debounced postMessage
- [ ] Write failing test: `onboarding/step-1.vue` saves `onboardingStep = 1` on continue
- [ ] Implement `step-1.vue`
- [ ] Implement `FontSelector.vue` with 10 curated Google Fonts:
  - Inter, Roboto, Lato, Montserrat, Open Sans, Poppins, Nunito, Raleway, Source Sans 3, Playfair Display
- [ ] Implement `ColorPicker.vue` (12 preset swatches + hex input)

### Admin Shell Tasks

- [ ] Implement `apps/admin/app/middleware/onboarding.global.ts`
- [ ] Implement `apps/admin/app/pages/owner/onboarding/step-3.vue`
- [ ] Implement `apps/admin/app/pages/owner/dashboard.vue` (post-onboarding landing)
- [ ] Implement `apps/admin/server/middleware/auth.ts` (Firebase token validation)
- [ ] Implement `GET /api/owner/business` and `PATCH /api/owner/business`
- [ ] Write E2E (Playwright): complete 3-step onboarding flow

---

## Gherkin Scenarios

### Feature: Onboarding Flow

```gherkin
Feature: Onboarding flow
  As a newly activated business owner
  I want to be guided through setting up my store
  So that I have a configured store before accessing the dashboard

  Background:
    Given I am authenticated as a business owner with role "owner"
    And my business has onboardingStep = 0

  Scenario: New owner completes all 3 onboarding steps
    Given I navigate to "/owner/dashboard"
    Then I am redirected to "/owner/onboarding/step-1"
    When I select a primary color "#E63946"
    And I type "Los mejores tacos de la colonia" in the tagline field
    And I click "Continuar"
    Then my business onboardingStep is 1 in Firestore
    And I am on "/owner/onboarding/step-2"
    When I type "Taco de canasta" in the product name field
    And I type "25" in the price field
    And I click "Publicar Producto"
    Then a new item exists in Firestore with name "Taco de canasta"
    And my business onboardingStep is 2 in Firestore
    And I am on "/owner/onboarding/step-3"
    When I click "Ir a mi panel"
    Then my business onboardingStep is 3 in Firestore
    And I am on "/owner/dashboard"

  Scenario: Owner tries to navigate directly to Step 2 without completing Step 1
    Given my business has onboardingStep = 0
    When I navigate directly to "/owner/onboarding/step-2"
    Then I am redirected to "/owner/onboarding/step-1"
    And I see the step 1 form

  Scenario: Owner returns to dashboard after onboarding is complete
    Given my business has onboardingStep = 3
    When I navigate to "/owner/dashboard"
    Then I am not redirected
    And I see the owner dashboard
    And the onboarding pages are not shown
```

### Feature: Product Management

```gherkin
Feature: Product management
  As a business owner
  I want to manage my product catalog
  So that customers see up-to-date products on my storefront

  Background:
    Given I am authenticated as a business owner with role "owner"
    And my business onboardingStep is 3
    And I am on "/owner/products"

  Scenario: Owner adds a product with all fields
    When I click "Agregar Producto"
    And I type "Taco de canasta" in the name field
    And I type "25" in the price field
    And I upload a valid JPEG file "taco.jpg" (size: 500KB)
    And I select category "Tacos"
    And I toggle visibility to on
    And I click "Guardar"
    Then a POST request is sent to "/api/owner/items"
    And the response status is 201
    And the product "Taco de canasta" appears in the product list
    And the product has a thumbnail image

  Scenario: Owner adds a product above the plan limit on Free plan
    Given my business has plan "free"
    And my business already has 10 items in Firestore
    When I click "Agregar Producto"
    And I fill in name "Producto 11" and price "100"
    And I click "Guardar"
    Then a POST request is sent to "/api/owner/items"
    And the response status is 403
    And the response body contains error "PLAN_LIMIT_REACHED"
    And the response body contains limit 10 and current 10
    And I see the upgrade modal with a link to "/owner/billing/upgrade"
    And no new item is created in Firestore

  Scenario: Owner hides a product and it disappears from storefront within 60s
    Given a product "Taco de canasta" exists with visible = true
    When I toggle the visibility switch for "Taco de canasta" to off
    Then a PATCH request is sent to "/api/owner/items/{id}/visibility" with body { "visible": false }
    And the response status is 200
    And the product visible field in Firestore is false
    And within 60 seconds the product does not appear on the public storefront page

  Scenario: Owner uploads a valid JPEG image for a product
    When I click "Agregar Producto"
    And I attach file "product.jpg" with MIME type "image/jpeg" and size 800KB
    Then no client-side error is shown
    And when I submit the form a POST request is sent to "/api/owner/logo"
    And the server responds with status 200 and a Cloud Storage URL
    And the product is saved with the returned imageUrl

  Scenario: Owner uploads an SVG file for a product image
    When I click "Agregar Producto"
    And I attach file "icon.svg" with MIME type "image/svg+xml"
    Then I see the error "Tipo de archivo no permitido. Usa JPEG, PNG o WebP."
    And no upload request is sent to the server
    And the form cannot be submitted with the invalid file
```

### Feature: Appearance Customization

```gherkin
Feature: Appearance customization
  As a business owner
  I want to customize my store's colors, logo, and fonts
  So that the storefront matches my brand

  Background:
    Given I am authenticated as a business owner with role "owner"
    And my business onboardingStep is 3
    And I am on "/owner/theme"

  Scenario: Owner changes primary color and live preview updates within 500ms
    Given the ThemePreview iframe is loaded
    When I change the primary color to "#1D3557"
    Then within 500ms the ThemePreview iframe receives a postMessage with type "THEME_UPDATE"
    And the message contains token "--color-primary" with value "#1D3557"
    And the preview visually reflects the new color

  Scenario: Owner uploads a logo over 2MB and it is rejected before upload
    When I drag and drop a file "big-logo.png" with size 3MB onto the logo upload area
    Then I see the error "El archivo es demasiado grande. Máximo 2MB."
    And no network request is sent to "/api/owner/logo"
    And the existing logo is unchanged

  Scenario: Owner selects a font and preview updates
    When I click the font "Montserrat" in the font selector
    Then within 500ms the ThemePreview iframe receives a postMessage with type "THEME_UPDATE"
    And the message contains font "Montserrat"
    And the "Guardar Apariencia" button is enabled

  Scenario: Owner saves appearance changes
    Given I have selected color "#E63946" and font "Poppins"
    When I click "Guardar Apariencia"
    Then a PATCH request is sent to "/api/owner/business" with the theme object
    And the response status is 200
    And a success toast "Apariencia guardada" is shown
```

---

## Definition of Done

- [ ] All Gherkin scenarios pass (Playwright E2E + Vitest unit tests)
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] Plan limit is enforced server-side (unit test verifies 403 response at limit)
- [ ] Logo upload: magic bytes check is tested with a fabricated SVG file renamed to `.jpg`
- [ ] Live preview postMessage timing tested (Vitest fake timers, assert < 500ms debounce)
- [ ] Onboarding guard tested: direct URL navigation to step N+1 redirects to step N
- [ ] Drag-to-reorder calls `PATCH /api/owner/items/order` with correct payload
- [ ] Category delete does not delete products (Firestore rule tested in emulator)
- [ ] Module Federation: both MFEs load in the shell app without HMR errors in dev
- [ ] Soft delete: `DELETE /api/owner/items/{id}` sets `visible=false` and `deletedAt`, does not remove document
- [ ] Image resize: uploaded images max 1200px width (test with `sharp` metadata check)
- [ ] No secrets or API keys committed
- [ ] MR description filled with: screenshot of onboarding flow, screenshot of product list, screenshot of theme editor

---

## MR Template

```markdown
## Sprint 5 — Owner Dashboard

### Changes
- [ ] Catalog MFE (`apps/mfe/catalog`)
- [ ] Appearance MFE (`apps/mfe/appearance`)
- [ ] Onboarding flow (3 steps)
- [ ] API endpoints: items, categories, logo, business
- [ ] Plan limits enforced server-side

### Screenshots
<!-- Onboarding Step 1 -->
<!-- Onboarding Step 2 -->
<!-- Onboarding Step 3 -->
<!-- Product list with reorder -->
<!-- Theme editor with live preview -->

### Test Coverage
- Unit tests: `pnpm test --filter catalog`
- Unit tests: `pnpm test --filter appearance`
- E2E: `pnpm test:e2e --grep "Onboarding|Product|Appearance"`

### Checklist
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Plan limit returns 403 at limit (not 401, not 400)
- [ ] SVG upload rejected by server magic bytes check
- [ ] Onboarding guard tested for direct URL navigation
- [ ] No `[TODO]` comments left in code
- [ ] Target branch: `develop`
```
