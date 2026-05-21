# Sprint 1 — Foundation (FastAPI + Firestore)

| Field | Value |
|---|---|
| Branch | `sprint/1-foundation` from `develop` |
| Status | ✅ Done |
| Stack | FastAPI Python 3.13, uv, Firestore, Firebase Admin SDK |
| Initiatives | Platform Core (US-005, US-006, US-007) |
| Pre-condition | Sprint 0 merged to `develop` |

---

## Objective

Stand up the FastAPI backend with Firestore persistence, Firebase Auth middleware, structured logging, rate limiting, and a health check endpoint. This is the foundation every product sprint depends on. No user-visible UI.

---

## Key Files

```
apps/api/
├── main.py                          — FastAPI app, middleware order
├── pyproject.toml                   — uv dependencies
├── Dockerfile                       — python:3.13-slim
└── app/
    ├── routers/
    │   └── health.py                — GET /health
    ├── db.py                        — Firestore client singleton
    ├── shared/
    │   ├── middleware/
    │   │   └── auth_middleware.py   — Firebase JWT verify, TTL cache, PUBLIC_PREFIXES
    │   ├── auth/
    │   │   ├── firebase_verifier.py — verify_firebase_token()
    │   │   └── jwt_models.py        — UserContext, Role, FirebaseClaims
    │   └── logging/
    │       └── structured.py        — JSON logger with traceId, businessId
    └── dependencies.py              — require_role(), get_current_user()
```

---

## Middleware Order (Critical)

```python
# main.py — order matters. LAST add_middleware = outermost = first to handle response
app.add_middleware(AuthMiddleware)    # inner — runs first on request, last on response
app.add_middleware(                   # outer — wraps everything including 401s
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

If this order is reversed, CORS headers are missing from 401 responses → browser CORS errors.

---

## Auth Middleware Logic

1. Skip `OPTIONS` preflight (return immediately)
2. Skip public paths (`/health`, `/api/v1/storefront/`, `/api/v1/prospects`, `/auth/`)
3. Local dev bypass: `DEV_USER_EMAIL` + `ENVIRONMENT=local` → inject SUPER_ADMIN user
4. Service-to-service: `x-internal-service-secret` header bypass
5. Extract `Authorization: Bearer {token}`
6. Check in-process TTL cache (60s) — avoids Firebase round-trip on hot paths
7. Verify token with Firebase Admin SDK
8. Store `UserContext` in `request.state.user`

---

## Health Endpoint

```python
GET /health
→ { "status": "ok", "version": "...", "timestamp": "..." }
```

Used by Cloud Run startup probe and liveness probe.

---

## Rate Limiting (slowapi)

```python
@limiter.limit("100/minute")  # general API
@limiter.limit("5/day")       # AI generation endpoint
```

---

## Structured Logging

```python
logger.info("request", extra={
    "trace_id": request.state.trace_id,
    "business_id": user.business_id,
    "method": request.method,
    "path": request.url.path,
})
```

JSON format in production — compatible with Cloud Logging.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `FIRESTORE_PROJECT_ID` | ✓ | GCP project with Firestore (`ei-catalog-dev`) |
| `FIREBASE_AUTH_PROJECT_ID` | ✓ | Firebase project for token verification (`catalog-mx-dev`) |
| `DEV_USER_EMAIL` | dev only | Bypasses auth in local env |
| `ENVIRONMENT` | ✓ | `local` / `dev` / `stg` / `prod` |
| `INTERNAL_SERVICE_SECRET` | optional | Service-to-service bypass |
| `AUTH_CACHE_TTL_SECONDS` | optional | Default: 60 |

---

## Tests

### Unit (Vitest / pytest)
- `verify_firebase_token` raises on expired token
- `_claims_to_user` defaults to `OWNER` role when no role in claims
- TTL cache returns cached user on second call without Firebase round-trip
- `OPTIONS` request bypasses auth and returns 200

### Integration (FastAPI + Firebase emulator)
- `GET /health` returns 200 with `{ status: 'ok' }`
- `GET /api/v1/businesses` without token returns 401 with CORS headers
- `GET /api/v1/businesses` with valid SUPER_ADMIN token returns 200
- `POST /api/v1/generate` returns 429 after 5 calls in one day (rate limit)
- `GET /api/v1/storefront/{slug}` returns 200 without any token (public)

---

## Acceptance Criteria

- [ ] `GET /health` returns `{ status: 'ok' }` in < 100ms
- [ ] Unauthenticated request to `/api/v1/businesses` returns 401 with CORS headers
- [ ] `OPTIONS` preflight returns 200 without triggering auth
- [ ] Public paths (`/api/v1/storefront/`, `/api/v1/prospects`) skip auth
- [ ] Rate limiter returns 429 after 100 req/min on general endpoints
- [ ] `uv run pytest` passes with zero failures
