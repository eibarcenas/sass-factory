# Sprint 10 — Testing (Vitest + Playwright)

| Field | Value |
|---|---|
| Branch | `sprint/10-testing` from `develop` |
| Status | ⏳ Pending |
| Stack | Vitest, Playwright, Firebase Emulator, pytest |
| Initiatives | Platform Core (US-001, US-002) |
| Pre-condition | Sprint 9 merged to `develop` |

---

## Objective

This is a technical debt sprint. No new features. Ship a test suite that validates the entire system — unit tests for pure logic, integration tests against the real Firestore emulator, and E2E tests for the critical user journeys. Configure CI to block merges on test failure.

---

## Scope

### 1. Vitest — Admin (React)

```
apps/admin-fe/src/__tests__/
├── auth/
│   ├── RequireAuth.test.tsx        — redirect when no user
│   ├── RequireOwner.test.tsx       — redirect SUPER_ADMIN to /
│   └── RequireSuperAdmin.test.tsx  — redirect OWNER to /owner
├── components/
│   ├── StatusBadge.test.tsx        — all 8 status colors
│   ├── ImageUpload.test.tsx        — validation, success state, error state
│   └── ProductEditor.test.tsx      — add/edit/delete flow
├── hooks/
│   ├── useBusinesses.test.ts       — list, filter, action mutation
│   └── useItems.test.ts            — CRUD operations
└── store/
    └── auth.test.ts                — setUser, mockMode behavior
```

### 2. Vitest — Storefront (Next.js)

```
apps/storefront-fe/__tests__/
├── lib/
│   └── api.test.ts                 — getCatalog: ISR revalidate values, null on 404
└── components/
    └── WhatsAppButton.test.tsx     — URL construction, trackClick fire-and-forget
```

### 3. pytest — FastAPI

```
apps/catalog-api/tests/
├── conftest.py                     — Firebase emulator setup, test client
├── test_auth_middleware.py         — 401 without token, OPTIONS bypass, public paths
├── test_businesses.py              — CRUD, status machine transitions
├── test_items.py                   — add, edit, delete, plan limit 403
├── test_prospects.py               — public POST, SUPER_ADMIN GET
├── test_images.py                  — MIME validation, size limit
└── test_analytics.py               — click recording, aggregation, role guards
```

### 4. Playwright — E2E

```
e2e/
├── auth.spec.ts                    — login, session persistence, role redirect
├── admin-demo.spec.ts              — generate demo, status transitions
├── storefront.spec.ts              — catalog load, WhatsApp URL, demo banner
├── owner-dashboard.spec.ts         — product CRUD, hide/show, appearance
├── prospects.spec.ts               — form submit → admin notification
└── superadmin.spec.ts              — business pipeline, suspend, reactivate
```

---

## Firebase Emulator Setup

```bash
# firebase.json — emulator config
{
  "emulators": {
    "firestore": { "port": 8080 },
    "auth": { "port": 9099 },
    "ui": { "enabled": true }
  }
}
```

pytest `conftest.py` sets `FIRESTORE_EMULATOR_HOST=localhost:8080` and `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099` before each test run.

---

## CI Pipeline Update

Add to all three deploy workflows (`deploy-dev.yml`, `deploy-stg.yml`, `deploy-prod.yml`):

```yaml
jobs:
  test:
    steps:
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm --filter admin-fe test:unit
      - run: pnpm --filter storefront-fe test:unit
      - run: cd apps/catalog-api && uv run pytest
      - run: pnpm e2e          # Playwright against local dev server
  deploy:
    needs: [test]              # blocks deploy if tests fail
```

---

## Makefile Targets

```makefile
test:           ## run all tests
test-unit:      ## Vitest unit tests only
test-api:       ## pytest for FastAPI
test-e2e:       ## Playwright E2E
test-emulator:  ## start Firebase emulator + run integration tests
```

---

## Acceptance Criteria

- [ ] `make test` runs all tests and exits 0 when all pass
- [ ] CI blocks deploy if any test fails
- [ ] Vitest: ≥ 80% coverage on business status machine logic
- [ ] pytest: all status transition edge cases covered
- [ ] Playwright: all 6 critical user journey specs pass
- [ ] Firebase emulator starts automatically in CI
- [ ] `pnpm typecheck` passes with zero errors
