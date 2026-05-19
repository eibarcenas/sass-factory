from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["storefront"])

# TODO Sprint 3: replace with Firestore reads
MOCK_CATALOG = {
    "heladeria-pinguino": {
        "id": "heladeria-pinguino",
        "slug": "heladeria-pinguino",
        "name": "Heladería El Pingüino",
        "type": "heladeria",
        "whatsapp": "+521234567890",
        "city": "Monterrey",
        "tagline": "La mejor heladería artesanal de Monterrey 🍦",
        "theme": {
            "primary": "#06b6d4",
            "secondary": "#cffafe",
            "accent": "#f59e0b",
            "background": "#f0fdfe",
            "font": "Quicksand",
            "emoji": "🍦",
        },
        "status": "demo",
        "plan": "free",
        "items": [
            {"id": "item-1", "name": "Sundae de chocolate", "price": 85, "currency": "MXN", "visible": True, "order": 1},
            {"id": "item-2", "name": "Nieve de vainilla", "price": 40, "currency": "MXN", "visible": True, "order": 2},
            {"id": "item-3", "name": "Malteada de fresa", "price": 65, "currency": "MXN", "visible": True, "order": 3},
        ],
    }
}

@router.get("/storefront/{slug}")
def get_storefront(slug: str):
    business = MOCK_CATALOG.get(slug)
    if not business:
        raise HTTPException(status_code=404, detail=f"Business '{slug}' not found")
    if business["status"] == "suspended":
        raise HTTPException(status_code=410, detail="This business is currently suspended")
    return business
