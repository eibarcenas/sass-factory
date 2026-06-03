# US-043 — Extract @catalog-mx/auth and @catalog-mx/client (Phase 2 SDK)

| Field | Value |
|---|---|
| Epic | E19 — Platform SDK Extraction |
| Initiative | I6 — Factory SDK |
| Sprint | 17 |
| Status | 🔄 In Progress |

**As** a platform engineer, **I want** the Firebase auth restore logic and the typed HTTP client to live in shared packages, **so that** any new app (cotizador, dating, church tools) can consume them without copy-pasting infrastructure code.

> **Depends on:** US-042 (packages/ui consolidation) ✅
> **Unlocks:** Phase 3 — new app scaffolds consume factory-sdk

---

## Context

Two pieces of admin infrastructure are currently app-local and would be copy-pasted into every new app:

1. **`apps/admin-fe/src/lib/api.ts`** — A generic typed HTTP client (Bearer token injection,
   upload, typed error shape). No catalog-specific logic; pure transport layer.

2. **`apps/admin-fe/src/store/auth.ts`** + **`useAuthRestore` in App.tsx`** — Firebase
   session restore, Zustand auth store, mock mode. The only catalog-specific part is
   `UserRole = 'SUPER_ADMIN' | 'OWNER'`, which becomes `string` in the generic package.

**What stays in admin (not extracted):**
- Route guards (`RequireAuth`, `RequireSuperAdmin`, `RequireOwner`) — 3-line wrappers,
  catalog-specific role names, not worth generalizing yet.
- Storefront's `lib/api.ts` — catalog-domain functions (`getCatalog`), not a generic client.

**`businessId` field:** kept as-is in the generic `AuthUser` interface. All three target
apps (cotizador, church, dating) have a tenant-owner concept that maps naturally to
`businessId`. Rename to `tenantId` when a non-business app actually needs a different name.

---

## Packages to create

### `packages/client` → `@catalog-mx/client`

```
createApiClient({ baseUrl, getToken }) → { get, post, patch, del, upload }
```

Admin's `lib/api.ts` becomes a thin wrapper: creates the client instance, wires
Firebase token retrieval, re-exports as `api`.

### `packages/auth` → `@catalog-mx/auth`

```
AuthUser          — interface: uid, email, role: string, businessId?, modules[]
AuthStore         — interface for the Zustand store shape
createAuthStore() — Zustand store factory (generic, no Vite/Firebase coupling)
useFirebaseAuthRestore(store, config)  — Firebase session restore hook
```

Admin's `store/auth.ts` calls `createAuthStore()` and wires mock mode via its own
env vars. Admin's `App.tsx` calls `useFirebaseAuthRestore` from the package.

---

## Acceptance Criteria

```gherkin
Given I import createApiClient from @catalog-mx/client
When I call createApiClient({ baseUrl, getToken })
Then I get a typed client with get/post/patch/del/upload methods

Given I import createAuthStore from @catalog-mx/auth
When I call createAuthStore()
Then I get a Zustand store with user/mockMode/loading/setUser/setLoading

Given I import useFirebaseAuthRestore from @catalog-mx/auth
When I call it in a React component
Then Firebase auth state is restored on mount

Given pnpm -F @catalog-mx/client typecheck
When I run it
Then it exits 0

Given pnpm -F @catalog-mx/auth typecheck
When I run it
Then it exits 0

Given pnpm -F admin-fe typecheck
When I run it
Then it exits 0

Given pnpm -F admin-fe test
When I run it
Then all tests pass
```

---

## Subtasks

- [ ] Create `packages/client` with `createApiClient` factory
- [ ] Create `packages/auth` with `AuthUser`, `createAuthStore`, `useFirebaseAuthRestore`
- [ ] Admin `lib/api.ts` → thin wrapper using `@catalog-mx/client`
- [ ] Admin `store/auth.ts` → uses `createAuthStore` from `@catalog-mx/auth`
- [ ] Admin `App.tsx` `useAuthRestore` → uses `useFirebaseAuthRestore` from `@catalog-mx/auth`
- [ ] All typechecks pass, all admin tests pass

## Definition of Done

- `packages/client` and `packages/auth` exist with working typechecks
- Admin imports auth + client from shared packages, not local implementations
- Zero behavior changes — pure structural refactor
