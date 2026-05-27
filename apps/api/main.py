import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import health, businesses, demos, storefront, prospects, images, auth
from factory_auth import AuthMiddleware

def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)

limiter = Limiter(key_func=_client_ip)

app = FastAPI(title="catalog.mx API", version="0.1.0", docs_url="/docs")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Auth middleware — added FIRST so CORS wraps it (CORS added last = outermost)
app.add_middleware(
    AuthMiddleware,
    public_prefixes=(
        "/api/v1/storefront/",
        "/api/v1/prospects",
        "/api/v1/demos/",
        "/auth/",
    ),
)

# CORS — added LAST = outermost middleware = adds headers to ALL responses including 401/403
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(health.router)
app.include_router(businesses.router, prefix="/api/v1")
app.include_router(demos.router, prefix="/api/v1")
app.include_router(storefront.router, prefix="/api/v1")
app.include_router(prospects.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
