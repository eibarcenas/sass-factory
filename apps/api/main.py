from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, businesses, demos, storefront

app = FastAPI(
    title="catalog.mx API",
    version="0.1.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3010"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(businesses.router, prefix="/api/v1")
app.include_router(demos.router, prefix="/api/v1")
app.include_router(storefront.router, prefix="/api/v1")
