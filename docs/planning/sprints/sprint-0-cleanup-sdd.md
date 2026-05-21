# Sprint 0 — Cleanup + Core Domain Reset

| Field | Value |
|---|---|
| Branch | `sprint/0-cleanup-sdd` from `develop` |
| Status | ✅ Done |
| Stack | TypeScript, pnpm monorepo |
| Initiatives | Platform Core (E1 partial) |
| Pre-condition | None — this is the base sprint |

---

## Objective

Remove all wrong and misleading code and documentation that describes the previous event-landing-page domain (love/bday/mom events, Python FastAPI, Next.js, React). Rewrite `@sass-factory/core` types for the catalog SaaS domain. Establish the authoritative technical spec so every subsequent sprint agent has a clean base.

This sprint produces no user-visible feature. Its output is a codebase that compiles cleanly, has no misleading artifacts, and whose type system accurately describes the catalog domain.

---

## Pre-conditions

- `develop` branch is the base.
- All agents have read access to `packages/core/src/types/app.ts` before deleting it.
- No other sprint branch is open.

---

## Agent Assignment

| Agent | Runs | Responsibility |
|-------|------|----------------|
| `cleanup-agent` | First, immediately | Delete stale files, remove references, clean barrel exports |
| `types-agent` | In parallel (after reading app.ts for reference) | Write new domain types, update barrel, verify compilation |

Both agents commit to the same branch. `cleanup-agent` must commit its deletions before `types-agent` removes the old type file, to avoid merge conflicts on the barrel export.

---

## What to DELETE — File by File

### Documentation files

| File | Reason to delete |
|------|-----------------|
| `docs/architecture/backend.md` | Describes a Python FastAPI backend that was never built and is not part of this stack. Creates confusion about what technology is actually used. |
| `docs/architecture/microservices.md` | Describes a Node.js modular microservices architecture that does not match the Nuxt 4 monorepo setup. |
| `docs/architecture/event-driven.md` | Describes Google Eventarc and Cloud Functions pub/sub patterns that are not used in this system. |
| `docs/development/monorepo.md` | Contains references to Next.js workspace setup and Next.js-specific tooling. Misleads about the actual pnpm + Nuxt 4 setup. |
| `docs/development/notifications.md` | Describes a React + Sonner toast library integration. The actual stack is Vue 3 with custom notifications via SSE. |
| `docs/development/testing.md` | Describes Vitest + Playwright configured for Next.js. Sprint 1 will write the real testing setup from scratch. |
| `docs/planning/sprint-backlog.md` | Contains sprints that were planned for the event-page domain that never executed. Replaced entirely by the sprint files in `docs/planning/sprints/`. |

### Source code files and folders

| File/Folder | Reason to delete |
|-------------|-----------------|
| `packages/core/src/types/app.ts` | Contains `AppTopic` (love/bday/mom/xmas), `TOPIC_PRESETS`, `AppFeature` (hero/timeline/gallery/letter/moments/music/countdown/closing), and `AppConfig` — all event-domain types. Replaced by catalog domain types in this sprint. |
| `apps/admin/server/utils/provisioning.ts` | Contains fake `sleep()` calls simulating infra provisioning steps. Pure theater — not connected to any real infrastructure. The real provisioning is handled by `local-simulator.ts` (Docker) and `k8s-simulator.ts`. |
| `apps/admin/server/api/infra/` (entire folder) | Stub HTTP endpoints that were never wired to real infra. Includes `deploy.post.ts`, `simulate.post.ts`, `register.post.ts`, `index.get.ts`, `deploy-complete.post.ts`. These were placeholders. The real deployment flow will be in Sprint 4 under `/api/admin/`. |

### How to verify nothing references deleted files

After deletions, run:

```bash
# Find any remaining import of deleted files
grep -r "provisioning" apps/ packages/ --include="*.ts" --include="*.vue"
grep -r "AppTopic\|AppFeature\|TOPIC_PRESETS\|AppConfig" apps/ packages/ --include="*.ts" --include="*.vue"
grep -r "from.*types/app" apps/ packages/ --include="*.ts" --include="*.vue"
grep -r "api/infra" apps/ --include="*.ts" --include="*.vue"
```

All must return zero results.

---

## What to CREATE — New Domain Types

### File: `packages/core/src/types/business.ts`

```typescript
/**
 * Business domain types for catalog.mx
 * Replaces the event-themed AppConfig types from the previous domain.
 */

/**
 * BusinessStatus represents the full lifecycle of a business in the platform.
 *
 * State machine:
 *   draft → demo → sent → accepted → active → suspended → active (re-activation)
 *                       → expired (no response within 7 days)
 *
 * Rules:
 *   - Only forward transitions are valid (except suspended ↔ active).
 *   - draft is the only initial state (created by AI generation).
 *   - active is the only state where the storefront is publicly accessible
 *     without a demo banner.
 *   - demo state: storefront accessible with "¿Quieres esto?" banner.
 *   - sent state: demo URL was shared with the prospect.
 *   - accepted: prospect clicked the CTA; admin must now activate manually.
 *   - expired: sent for 7+ days with no response.
 */
export type BusinessStatus =
  | 'draft'       // AI-generated, not yet shared
  | 'demo'        // Published to demo URL, banner visible
  | 'sent'        // Demo URL sent to prospect via WhatsApp/email
  | 'accepted'    // Prospect accepted via CTA on demo page
  | 'expired'     // Sent but no response in 7 days
  | 'active'      // Paying customer, full storefront live
  | 'suspended'   // Temporarily taken down (non-payment or admin action)

/**
 * Valid status transitions. Anything not in this map is forbidden.
 * Key: current status. Value: statuses it can transition to.
 */
export const VALID_TRANSITIONS: Record<BusinessStatus, BusinessStatus[]> = {
  draft:     ['demo'],
  demo:      ['sent'],
  sent:      ['accepted', 'expired'],
  accepted:  ['active'],
  expired:   [],           // terminal — must regenerate from draft
  active:    ['suspended'],
  suspended: ['active'],
}

/**
 * Validates whether a status transition is allowed.
 * @throws Error with descriptive message if transition is invalid.
 */
export function validateTransition(from: BusinessStatus, to: BusinessStatus): void {
  const allowed = VALID_TRANSITIONS[from]
  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid status transition: ${from} → ${to}. ` +
      `Allowed from ${from}: [${allowed.join(', ') || 'none'}]`
    )
  }
}

/**
 * BusinessType categorizes the kind of business.
 * Used by the AI to generate appropriate sample items and default theme.
 */
export type BusinessType =
  | 'restaurant'    // Full meals, combos, drinks
  | 'cafe'          // Coffee, pastries, light food
  | 'bakery'        // Bread, cakes, pastries
  | 'ice_cream'     // Helados, paletas, nieves
  | 'food_truck'    // Street food, tacos, burgers
  | 'clothing'      // Ropa, accesorios, calzado
  | 'beauty'        // Salón, barbería, uñas, cejas
  | 'pharmacy'      // Farmacia, suplementos
  | 'hardware'      // Ferretería, herramientas
  | 'electronics'   // Gadgets, reparaciones
  | 'grocery'       // Abarrotes, miscelánea
  | 'flowers'       // Florería, arreglos
  | 'other'         // Catch-all

/**
 * BusinessTheme defines the visual identity of the storefront.
 * Colors are hex strings. Font is a Google Font name.
 */
export interface BusinessTheme {
  primary: string       // Main brand color (hex, e.g. "#10b981")
  secondary: string     // Supporting color (hex)
  accent: string        // CTA and highlight color (hex)
  background: string    // Page background (hex)
  font: string          // Google Font name (e.g. "Nunito", "Playfair Display")
  emoji: string         // Single emoji representing the business type
}

/**
 * Business is the central aggregate of the catalog platform.
 * One business = one public storefront = one Firestore document.
 */
export interface Business {
  id: string                    // Firestore document ID (also the slug)
  slug: string                  // URL-safe identifier: used in /{slug} and /demo/{slug}
  name: string                  // Display name (e.g. "Heladería El Pingüino")
  tagline: string               // Short description shown on storefront header
  type: BusinessType            // Business category
  theme: BusinessTheme          // Visual identity
  status: BusinessStatus        // Current lifecycle state
  phone: string                 // WhatsApp phone in E.164 format (e.g. "+5215512345678")
  email?: string                // Optional contact email
  address?: string              // Optional physical address
  logoUrl?: string              // Firestore Storage URL for logo image
  ownerId?: string              // Firebase Auth UID — set when business is activated
  prospectId?: string           // Reference to Prospect doc that accepted the demo
  generatedBy: string           // Firebase Auth UID of the admin who generated the demo
  createdAt: string             // ISO 8601 timestamp
  updatedAt: string             // ISO 8601 timestamp
  sentAt?: string               // When demo was shared with prospect
  acceptedAt?: string           // When prospect clicked CTA
  activatedAt?: string          // When admin activated the business
  suspendedAt?: string          // When business was suspended
  expiresAt?: string            // Computed: sentAt + 7 days
}
```

### File: `packages/core/src/types/item.ts`

```typescript
/**
 * Item and Category types for the business catalog.
 * Items belong to a Business and are grouped by Category.
 */

/**
 * Category groups items within a business catalog.
 * Stored as a subcollection: businesses/{businessId}/categories
 */
export interface Category {
  id: string            // Firestore document ID
  businessId: string    // Parent business ID
  name: string          // Display name (e.g. "Helados", "Bebidas")
  emoji?: string        // Optional category icon emoji
  order: number         // Display order (ascending)
  createdAt: string     // ISO 8601 timestamp
  updatedAt: string     // ISO 8601 timestamp
}

/**
 * Item represents a single product in the catalog.
 * Stored as a subcollection: businesses/{businessId}/items
 */
export interface Item {
  id: string              // Firestore document ID
  businessId: string      // Parent business ID
  categoryId: string      // Parent category ID
  name: string            // Product name (e.g. "Nieve de Vainilla")
  description?: string    // Optional longer description
  price: number           // Price in MXN pesos (number, stored as integer cents or float)
  originalPrice?: number  // Optional crossed-out original price (for discounts)
  imageUrl?: string       // Firestore Storage URL for product image
  available: boolean      // Whether item is currently available for order
  featured: boolean       // Whether item appears in "Destacados" section
  order: number           // Display order within category (ascending)
  tags?: string[]         // Optional free-form tags (e.g. ["sin gluten", "nuevo"])
  createdAt: string       // ISO 8601 timestamp
  updatedAt: string       // ISO 8601 timestamp
}

/**
 * Click tracks a WhatsApp order intent from a customer.
 * Written to Firestore for analytics. No PII beyond phone (optional).
 * Collection: businesses/{businessId}/clicks
 */
export interface Click {
  id: string              // Firestore document ID (auto-generated)
  businessId: string      // Which business catalog was viewed
  itemId?: string         // Which item was clicked (undefined = general WhatsApp)
  itemName?: string       // Denormalized item name for easy querying
  isDemo: boolean         // Whether click happened on /demo/{slug} (prospect view)
  userAgent?: string      // Browser UA string (for device analytics)
  referrer?: string       // HTTP Referer header
  createdAt: string       // ISO 8601 timestamp
}
```

### File: `packages/core/src/types/prospect.ts`

```typescript
/**
 * Prospect represents a potential customer who interacted with a demo storefront.
 * Created when a visitor fills out the "¿Quieres esto?" contact form.
 * Collection: prospects
 */

export type ProspectStatus =
  | 'pending'    // Form submitted, no admin action yet
  | 'contacted'  // Admin has reached out
  | 'converted'  // Business was activated for this prospect
  | 'rejected'   // Admin decided not to pursue

export interface Prospect {
  id: string                  // Firestore document ID
  businessId: string          // The demo business they were viewing
  businessName: string        // Denormalized business name for easy display
  name: string                // Prospect's full name
  phone: string               // Phone in E.164 format
  email?: string              // Optional email address
  message?: string            // Optional free-text message from the form
  status: ProspectStatus      // Current status of this prospect lead
  ipAddress?: string          // For duplicate detection (hashed or raw)
  submittedAt: string         // ISO 8601 timestamp
  contactedAt?: string        // When admin first contacted them
  convertedAt?: string        // When business was activated for them
  rejectedAt?: string         // When admin marked as rejected
  notes?: string              // Admin internal notes
}

/**
 * ProspectCreateInput is the validated shape of POST /api/prospects request body.
 * Does NOT include id, status, timestamps — those are server-generated.
 */
export interface ProspectCreateInput {
  businessId: string
  name: string
  phone: string               // Must be valid Mexican phone (10 digits or E.164)
  email?: string
  message?: string
}
```

### File: `packages/core/src/types/index.ts`

```typescript
/**
 * @sass-factory/core — Type barrel
 * All domain types for the catalog SaaS platform.
 */

export * from './business'
export * from './item'
export * from './prospect'
```

### Update: `packages/core/src/index.ts`

Replace the existing barrel that re-exported `app.ts` types. New content:

```typescript
/**
 * @sass-factory/core — Main package barrel
 */

// Domain types
export * from './types/index'

// Utilities
export * from './utils/collections'
export * from './utils/logger'  // Will be created in Sprint 1
```

> **Note to types-agent:** At Sprint 0 time, `utils/logger.ts` does not yet exist. Export it conditionally or comment it out — do not add it until Sprint 1 creates the file. Failing to typecheck due to a missing import is a blocker.

---

## Gherkin Specifications

```gherkin
Feature: Core types compile without errors
  As a developer
  I want the new domain types to compile with zero TypeScript errors
  So that all consuming packages can safely import them

  Background:
    Given the packages/core package has been built with the new types
    And the old app.ts types have been deleted

  Scenario: Business type with status 'demo' is valid
    Given I create a Business object with status 'demo'
    And all required fields are present (id, slug, name, tagline, type, theme, status, phone, generatedBy, createdAt, updatedAt)
    When I run "pnpm typecheck"
    Then the compilation succeeds with exit code 0
    And no TypeScript errors are reported

  Scenario: Status transition from 'demo' to 'sent' is valid via transition validator
    Given I call validateTransition('demo', 'sent')
    When the function executes
    Then no error is thrown
    And the function returns void

  Scenario: Status transition from 'active' to 'demo' is invalid (no going back)
    Given I call validateTransition('active', 'demo')
    When the function executes
    Then an Error is thrown
    And the error message contains "Invalid status transition: active → demo"
    And the error message contains "Allowed from active: [suspended]"

  Scenario: Item with optional imageUrl omitted is valid
    Given I create an Item object without an imageUrl field
    When I run "pnpm typecheck"
    Then the compilation succeeds with exit code 0

  Scenario: ProspectCreateInput without email is valid
    Given I create a ProspectCreateInput with name, phone, and businessId only
    When I run "pnpm typecheck"
    Then the compilation succeeds with exit code 0

  Scenario: VALID_TRANSITIONS covers all BusinessStatus values
    Given the VALID_TRANSITIONS constant is defined
    When I check its keys
    Then every BusinessStatus value ('draft', 'demo', 'sent', 'accepted', 'expired', 'active', 'suspended') is a key
    And no extra keys exist
```

---

## Step-by-Step Execution Order

```
1. cleanup-agent: git checkout -b sprint/0-cleanup-sdd from develop
2. cleanup-agent: Delete all documentation files listed above
3. cleanup-agent: Delete provisioning.ts
4. cleanup-agent: Delete apps/admin/server/api/infra/ folder
5. cleanup-agent: Grep for remaining references, fix any import that pointed to deleted files
6. cleanup-agent: Update packages/core/src/index.ts — remove re-exports of app.ts types
7. cleanup-agent: git add + git commit "chore(cleanup): remove stale event-domain docs and stub code"
8. types-agent (parallel or after step 6):
   a. Read packages/core/src/types/app.ts one last time for reference
   b. Delete packages/core/src/types/app.ts
   c. Create packages/core/src/types/business.ts (full content above)
   d. Create packages/core/src/types/item.ts (full content above)
   e. Create packages/core/src/types/prospect.ts (full content above)
   f. Create packages/core/src/types/index.ts (barrel)
   g. Update packages/core/src/index.ts to export from types/index
   h. Run: pnpm typecheck → must pass
   i. git add + git commit "feat(core): rewrite types for catalog domain"
9. Both agents: Merge commits on branch sprint/0-cleanup-sdd
10. Run final verification checks (see below)
11. Open MR to develop
```

---

## Verification Commands

```bash
# TypeScript — must be zero errors
pnpm typecheck

# Lint — must be clean
pnpm lint

# No references to deleted files
grep -r "AppTopic\|AppFeature\|TOPIC_PRESETS\|AppConfig\|provisioning\|api/infra" \
  apps/ packages/ \
  --include="*.ts" --include="*.vue" --include="*.md"

# Core package exports the new types
node -e "const c = require('./packages/core/dist/index.js'); console.log(Object.keys(c))"
# Should include: validateTransition, VALID_TRANSITIONS, and the interfaces (as type-only exports won't appear at runtime, but the module must load without errors)

# No deleted doc files remain
ls docs/architecture/backend.md 2>&1 | grep "No such file"
ls docs/architecture/microservices.md 2>&1 | grep "No such file"
ls docs/architecture/event-driven.md 2>&1 | grep "No such file"
ls docs/development/monorepo.md 2>&1 | grep "No such file"
ls docs/development/notifications.md 2>&1 | grep "No such file"
ls docs/development/testing.md 2>&1 | grep "No such file"
ls docs/planning/sprint-backlog.md 2>&1 | grep "No such file"
ls apps/admin/server/utils/provisioning.ts 2>&1 | grep "No such file"
ls apps/admin/server/api/infra/ 2>&1 | grep "No such file"
```

---

## MR Template

**Title:** `feat(sprint-0): cleanup stale domain + rewrite core types for catalog`

**Description:**

```
## What this MR does

Sprint 0 deliverable. Two coordinated changes:

### Cleanup (cleanup-agent)
- Deleted 7 documentation files describing wrong stack (Python FastAPI, Next.js, React, Node.js microservices, Eventarc)
- Deleted `provisioning.ts` (fake sleep() infrastructure theater)
- Deleted `apps/admin/server/api/infra/` (stub endpoints never connected to real infra)
- Removed all references to deleted files from barrel exports and imports

### Type Rewrite (types-agent)
- Deleted `packages/core/src/types/app.ts` (event-domain types: AppTopic, AppFeature, TOPIC_PRESETS, AppConfig)
- Created `packages/core/src/types/business.ts`: Business, BusinessStatus, BusinessType, BusinessTheme, validateTransition(), VALID_TRANSITIONS
- Created `packages/core/src/types/item.ts`: Item, Category, Click
- Created `packages/core/src/types/prospect.ts`: Prospect, ProspectCreateInput, ProspectStatus
- Created `packages/core/src/types/index.ts`: barrel export
- Updated `packages/core/src/index.ts`: now exports from types/index

## Pre-merge checklist
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm lint` passes with zero warnings
- [ ] No grep results for AppTopic, AppFeature, TOPIC_PRESETS, provisioning, api/infra
- [ ] All 9 deleted paths confirmed absent
- [ ] New types (Business, Item, Category, Prospect, validateTransition) importable from @sass-factory/core
- [ ] validateTransition throws on invalid transitions (manually verified)
- [ ] Branch is up to date with develop before merge

## Breaking changes
- `@sass-factory/core` no longer exports AppConfig, AppTopic, AppFeature, TOPIC_PRESETS, AppTheme (old one), FEATURE_LABELS
- Any code importing those types will break at compile time — this is intentional

## Reviewer notes
- apps/admin/app/ may have Vue components that imported old AppConfig for display. Verify those are removed or updated.
- packages/ui components may reference old types. Update as needed before merging.
```

---

## Tests

### Unit (Vitest)
- `validateTransition('draft', 'demo')` returns `true`
- `validateTransition('active', 'draft')` returns `false` (no backwards transitions)
- `validateTransition('demo', 'sent')` returns `true`
- All exported types from `@catalog-mx/core` compile without errors

### Static verification
- `pnpm typecheck` exits 0 across all packages
- `pnpm lint` exits 0 with zero warnings
- Zero grep matches for: `AppTopic`, `AppFeature`, `TOPIC_PRESETS`, `FEATURE_LABELS`, `provisioning`, `api/infra`

---

## Definition of Done

- [ ] All stale files deleted from repository
- [ ] `packages/core` exports `Business`, `BusinessStatus`, `BusinessType`, `BusinessTheme`, `validateTransition`, `VALID_TRANSITIONS`, `Item`, `Category`, `Click`, `Prospect`
- [ ] `validateTransition('demo', 'sent')` returns `true`
- [ ] `validateTransition('active', 'demo')` returns `false`
- [ ] `pnpm typecheck` passes with zero errors
- [ ] PR opened to `develop` and merged
