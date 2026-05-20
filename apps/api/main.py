import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import health, businesses, demos, storefront, prospects
from app.shared.middleware.auth_middleware import AuthMiddleware

# Rate limiter — use real client IP from X-Forwarded-For (behind GCP LB)
def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)

limiter = Limiter(key_func=_client_ip)

app = FastAPI(title="catalog.mx API", version="0.1.0", docs_url="/docs")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — explicit origins, never wildcard when allow_credentials=True
CORS_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3010"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

# Auth middleware — Firebase token verification + TTL cache
app.add_middleware(AuthMiddleware)

app.include_router(health.router)
app.include_router(businesses.router, prefix="/api/v1")
app.include_router(demos.router, prefix="/api/v1")
app.include_router(storefront.router, prefix="/api/v1")
app.include_router(prospects.router, prefix="/api/v1")
