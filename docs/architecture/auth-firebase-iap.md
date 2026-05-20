# Firebase + IAP Double-Auth Architecture

> Source: ARQ-06 — Firebase + IAP Double-Auth Architecture
> Status: Adopted for catalog.mx
> Last updated: 2026-05-20

## What we adopt now (MVP)

For the current stage (MVP, <100 users), we adopt the **Firebase Auth layer only**.
IAP requires an HTTPS Load Balancer ($18/month minimum) — deferred to when we need domain-level network gating.

### Adopted patterns

1. `verify_firebase_token()` with `check_revoked` (env-based guard for emulator)
2. In-process TTL cache (`cachetools.TTLCache`, 60s TTL) keyed by `firebase_uid`
3. `UserContext` model: `{ id, firebase_uid, email, role, modules }`
4. `require_role()` and `require_permission()` FastAPI dependencies
5. Rate limiting with `slowapi` (5 req/min on login)
6. `UserStatus`: INVITED → ACTIVE → INACTIVE
7. Custom claims: `{ role, modules }` baked into Firebase ID token
8. Frontend: `fetchWithAuth` interceptor with single-flight token refresh queue
9. React `ProtectedRoute` with role check
10. Audit log schema: `auth_events` table

### Deferred (post-MVP)

- IAP (Identity-Aware Proxy) — network-level domain gating
- TOTP 2FA
- VPC Service Controls
- App Check (ReCaptcha V3)

## Roles for catalog.mx

```python
class Role(StrEnum):
    SUPER_ADMIN = "SUPER_ADMIN"  # Erick — sees all businesses
    OWNER       = "OWNER"        # Business owner — sees only their business
```

## User lifecycle

```
Admin creates owner account  → status=INVITED
Owner clicks invite link     → status=ACTIVE, custom claims set
Owner uses app               → Bearer token on every request
Admin deactivates            → status=INACTIVE, revoke_refresh_tokens()
```

## Module access for owner

```python
# Custom claims on the token
{ "role": "OWNER", "modules": ["CATALOG", "APPEARANCE"], "businessId": "barberia-kingz" }
```

## Key implementation files

- `apps/api/app/shared/auth/firebase_verifier.py`
- `apps/api/app/shared/auth/jwt_models.py`
- `apps/api/app/shared/auth/rbac.py`
- `apps/api/app/shared/middleware/auth_middleware.py`
- `apps/admin/src/lib/auth.ts` — `fetchWithAuth` interceptor
- `apps/admin/src/context/AuthContext.tsx`

## Full architecture reference

See the complete ARQ-06 document in Obsidian or request from @infra-team.
