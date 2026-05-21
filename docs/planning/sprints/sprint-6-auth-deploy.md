# Sprint 6 — Auth + Cloud Run Deploy

| Field | Value |
|---|---|
| Branch | `sprint/6-auth-deploy` from `develop` |
| Status | ✅ Done |
| Stack | Firebase Auth, Google Sign-In, Docker, nginx, Cloud Run |
| Initiatives | Platform Core (US-005, US-006) |
| Pre-condition | Sprint 5 merged to `develop` |

---

## Objective

Replace email/password login with Google Sign-In (invite-only via allowlist), add custom Firebase claims for role-based access (`SUPER_ADMIN` / `OWNER` + `businessId`), fix session loss on page reload with `onAuthStateChanged`, and ship all three services (admin, API, storefront) to Cloud Run.

---

## Auth Architecture

```
Browser → Google Sign-In → Firebase Auth
                         → onAuthStateChanged → getIdTokenResult() → custom claims
                                                                    → role, businessId
                                                                    → Zustand store
```

Custom claims are set server-side (Python admin SDK) when an owner is activated.

```python
auth.set_custom_user_claims(uid, {
    'role': 'OWNER',
    'business_id': business_id,
    'modules': [],
})
```

---

## Session Persistence Fix

Before this sprint, Zustand store reset on page reload → redirect to `/login`.

Fix: `useAuthRestore` hook in `App.tsx` calls `onAuthStateChanged` on mount, restores session from Firebase's local persistence, shows a spinner during the ~200ms check.

```typescript
function useAuthRestore() {
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const { claims } = await fbUser.getIdTokenResult()
        setUser({ uid, email, role: claims.role, businessId: claims.business_id })
      }
      setChecking(false)
    })
    return unsubscribe
  }, [])
  return checking
}
```

---

## Firebase Auth Token in API Requests

All API calls from admin include `Authorization: Bearer {idToken}`:
```typescript
async function getToken() {
  const auth = getAuth()
  return auth.currentUser?.getIdToken() ?? null
}
```

`api.upload()` also includes the token — multipart/form-data requests need auth too.

---

## Docker + Cloud Run

### Admin (`apps/admin/Dockerfile`)
- Builder: `node:20-alpine`, runs `npm run build` → `dist/`
- Runner: `nginx:alpine` serves `dist/` on port 8080
- Firebase config baked in as `ENV` at build time (public by design — security via Firebase domain restrictions)

### API (`apps/api/Dockerfile`)
- `python:3.13-slim`, `uv pip install` from `pyproject.toml`
- Exposes port 8000, `/health` probe

### Storefront (`apps/storefront/Dockerfile`)
- Multi-stage Next.js standalone build
- `/health` route returns `{ status: 'ok' }` for Cloud Run startup probe

---

## Key Files

```
apps/admin/
├── Dockerfile
├── nginx.conf
└── src/App.tsx              — useAuthRestore hook, RequireAuth/RequireOwner/RequireSuperAdmin

apps/api/
├── Dockerfile
└── app/shared/
    ├── middleware/auth_middleware.py   — Firebase JWT verification, TTL cache
    └── auth/firebase_verifier.py       — FIREBASE_AUTH_PROJECT_ID support

apps/storefront/
├── Dockerfile
└── app/health/route.ts      — Cloud Run startup probe
```

---

## Auth Middleware Critical Notes

1. `CORSMiddleware` must be added **last** (`app.add_middleware`) so it is outermost — wraps 401s too.
2. `AuthMiddleware` must skip `OPTIONS` preflight: `if request.method == "OPTIONS": return await call_next(request)`
3. `FIREBASE_AUTH_PROJECT_ID=catalog-mx-dev` is separate from `FIRESTORE_PROJECT_ID=ei-catalog-dev` — tokens are issued by the Firebase project, data lives in the GCP project.

---

## Tests

### Unit (Vitest)
- `useAuthRestore` shows spinner while `checking=true`, hides on `checking=false`
- `RequireAuth` redirects to `/login` when `user` is null and not in mockMode
- `getToken` returns `null` when no `VITE_FIREBASE_API_KEY` (mock mode)

### Integration (FastAPI)
- Request with valid Firebase token sets `request.state.user` correctly
- Request without `Authorization` header returns 401 with CORS headers
- `OPTIONS` preflight returns 200 without auth check

### E2E (Playwright)
```
auth.spec.ts
  ✓ page reload does not redirect to /login (session persists)
  ✓ invalid/expired token returns to /login
  ✓ Google Sign-In flow completes and lands on correct role home
  ✓ admin API returns 401 with CORS headers (no browser CORS error)
```

---

## Acceptance Criteria

- [ ] Page reload preserves session — no flash redirect to login
- [ ] SUPER_ADMIN lands on `/`, OWNER lands on `/owner` after login
- [ ] All API calls include `Authorization: Bearer {token}`
- [ ] Image upload includes auth token (multipart too)
- [ ] `OPTIONS` preflight returns 200 without 401
- [ ] Admin deployed to Cloud Run and accessible at `catalog-mx-admin-dev-*.run.app`
- [ ] `pnpm typecheck` passes with zero errors
