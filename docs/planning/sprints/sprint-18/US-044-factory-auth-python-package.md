# US-044 — Extract factory_auth Python package to factory-sdk (Phase 3 SDK)

| Field | Value |
|---|---|
| Epic | E19 — Platform SDK Extraction |
| Initiative | I6 — Factory SDK |
| Sprint | 18 |
| Status | 🔄 In Progress |

**As** a platform engineer, **I want** the Firebase auth middleware and RBAC logic to live in a shared Python package, **so that** any new FastAPI app (cotizador, church, dating) installs it via git URL instead of copy-pasting 4 files.

> **Depends on:** US-043 (TS auth + client packages) ✅
> **Unlocks:** New app scaffolds consume factory_auth from day 1

---

## Context

`apps/catalog-api/app/shared/auth/` contains four files that are zero-percent catalog-specific:
- `firebase_verifier.py` — JWT verification against Firebase
- `jwt_models.py` — UserContext, FirebaseClaims, Role enum
- `rbac.py` — `require_role()`, `require_super_admin()`, `require_business_access()`
- `middleware/auth_middleware.py` — TTL cache, dev bypass, service-secret bypass

Currently hard-coded in the middleware:
- `PUBLIC_PREFIXES` — catalog-specific paths → made configurable
- `INTERNAL_SERVICE_USER` email — `internal@catalog.mx` → made configurable

New home: private GitHub repo `eibarcenas/factory-sdk`, subdirectory `python/`.
Install in any app: `factory-auth @ git+https://github.com/eibarcenas/factory-sdk.git#subdirectory=python`

---

## Changes

### factory-sdk (new private repo)
```
python/
├── pyproject.toml
└── factory_auth/
    ├── __init__.py
    ├── firebase_verifier.py
    ├── jwt_models.py          (role: str on UserContext — accepts any app-defined role)
    ├── rbac.py                (require_role(*roles: str), require_super_admin(),
    │                           require_business_access())
    └── middleware.py          (AuthMiddleware — public_prefixes configurable via __init__)
```

### catalog API (sass-factory)
- `pyproject.toml` — add `factory-auth @ git+...`
- `main.py` — `AuthMiddleware` import from `factory_auth`; pass catalog's `PUBLIC_PREFIXES`
- `routers/businesses.py`, `routers/prospects.py` — imports from `factory_auth`
- `tests/test_owner_endpoints.py` — imports from `factory_auth`
- Delete `app/shared/auth/` and `app/shared/middleware/`

---

## Acceptance Criteria

```gherkin
Given factory-auth is installed from git URL
When I import AuthMiddleware, require_role, UserContext, Role from factory_auth
Then they resolve correctly

Given cd apps/catalog-api && .venv/bin/pytest -q
When I run it
Then 38/38 pass

Given AuthMiddleware is initialized with catalog's PUBLIC_PREFIXES
When a request hits /api/v1/storefront/<slug>
Then it passes without auth
```

## Definition of Done
- `factory-sdk` repo exists with `python/factory_auth/` package
- Catalog API has zero local files in `app/shared/auth/` or `app/shared/middleware/`
- All 38 API tests pass
