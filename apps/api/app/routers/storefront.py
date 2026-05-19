from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["storefront"])

# Single source of truth: shared with admin routes
from app.routers.businesses import _businesses

@router.get("/storefront/{slug}")
def get_storefront(slug: str):
    business = next((b for b in _businesses if b["slug"] == slug), None)
    if not business:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")
    if business["status"] == "suspended":
        raise HTTPException(status_code=410, detail="This business is currently suspended")
    return business
