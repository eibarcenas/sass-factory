import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.limiter import limiter
from app.routers import health, businesses, storefront, images, requests, stores, legal
from factory_auth import AuthMiddleware

app = FastAPI(title="catalog.mx Stores API", version="0.1.0", docs_url="/docs")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Auth middleware — added FIRST so CORS wraps it (CORS added last = outermost)
app.add_middleware(
    AuthMiddleware,
    public_prefixes=(
        "/api/v1/stores/",
        "/api/v1/requests/",
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
app.include_router(storefront.router, prefix="/api/v1")
app.include_router(requests.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
app.include_router(stores.router, prefix="/api/v1")
app.include_router(legal.router, prefix="/api/v1")
