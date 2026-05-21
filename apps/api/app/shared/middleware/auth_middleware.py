import os
import asyncio
from cachetools import TTLCache
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.shared.auth.firebase_verifier import verify_firebase_token
from app.shared.auth.jwt_models import UserContext, Role, INTERNAL_SERVICE_USER, FirebaseClaims

SKIP_PATHS = {"/health", "/docs", "/openapi.json", "/redoc"}

# Public path prefixes — no auth required (storefront, prospect form)
PUBLIC_PREFIXES = (
    "/api/v1/storefront/",   # public catalog pages
    "/api/v1/prospects",     # prospect form submission (public)
    "/health",
    "/auth/",
)
CACHE_TTL  = int(os.getenv("AUTH_CACHE_TTL_SECONDS", "60"))

# TTLCache is not coroutine-safe — use asyncio.Lock for writes
_cache: TTLCache = TTLCache(maxsize=1000, ttl=CACHE_TTL)
_cache_lock = asyncio.Lock()

DEV_USER_EMAIL = os.getenv("DEV_USER_EMAIL")


def _claims_to_user(claims: FirebaseClaims) -> UserContext:
    role = claims.role or Role.OWNER
    return UserContext(
        firebase_uid=claims.uid,
        email=claims.email,
        role=role,
        modules=claims.modules,
        business_id=claims.business_id,
    )


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Skip public paths (exact match + prefix match)
        path = request.url.path
        # Skip CORS preflight — browser sends OPTIONS before the real request
        if request.method == "OPTIONS":
            return await call_next(request)
        if path in SKIP_PATHS or any(path.startswith(p) for p in PUBLIC_PREFIXES):
            return await call_next(request)

        # 2. Local dev bypass — never set in staging/prod
        if DEV_USER_EMAIL and os.getenv("ENVIRONMENT", "local") == "local":
            request.state.user = UserContext(
                firebase_uid="dev-uid",
                email=DEV_USER_EMAIL,
                role=Role.SUPER_ADMIN,
                modules=[],
            )
            return await call_next(request)

        # 3. Service-to-service secret bypass
        internal_secret = os.getenv("INTERNAL_SERVICE_SECRET")
        if internal_secret and request.headers.get("x-internal-service-secret") == internal_secret:
            request.state.user = INTERNAL_SERVICE_USER
            return await call_next(request)

        # 4. Extract Bearer token
        authorization = request.headers.get("Authorization", "")
        if not authorization.startswith("Bearer "):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=401, content={"detail": "Missing Authorization header"})

        token = authorization.removeprefix("Bearer ").strip()

        # 5. Check in-process cache
        cached = _cache.get(token)
        if cached:
            request.state.user = cached
            return await call_next(request)

        # 6. Verify with Firebase
        try:
            claims = verify_firebase_token(token)
        except Exception as exc:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=401, content={"detail": str(exc)})

        user = _claims_to_user(claims)

        # 7. Cache the resolved user
        async with _cache_lock:
            _cache[token] = user

        request.state.user = user
        return await call_next(request)
