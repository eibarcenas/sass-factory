from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(tags=["businesses"])

_businesses: list[dict] = [
    {
        "id": "heladeria-pinguino",
        "slug": "heladeria-pinguino",
        "name": "Heladería El Pingüino",
        "type": "heladeria",
        "whatsapp": "+521234567890",
        "city": "Monterrey",
        "tagline": "La mejor heladería artesanal de Monterrey 🍦",
        "theme": {"primary": "#06b6d4", "secondary": "#cffafe", "accent": "#f59e0b",
                  "background": "#f0fdfe", "font": "Quicksand", "emoji": "🍦"},
        "status": "demo",
        "plan": "free",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "items": [
            {"id": "item-1", "name": "Sundae de chocolate", "price": 85, "currency": "MXN",
             "description": "Con 3 bolas de helado artesanal", "visible": True, "order": 1},
            {"id": "item-2", "name": "Nieve de vainilla", "price": 40, "currency": "MXN",
             "visible": True, "order": 2},
            {"id": "item-3", "name": "Malteada de fresa", "price": 65, "currency": "MXN",
             "description": "Malteada cremosa con fresas naturales", "visible": True, "order": 3},
        ],
    }
]

VALID_TRANSITIONS: dict[str, list[str]] = {
    "draft":    ["demo", "archived"],
    "demo":     ["sent", "archived"],
    "sent":     ["accepted", "rejected", "expired"],
    "accepted": ["active", "archived"],
    "active":   ["suspended", "archived"],
    "suspended":["active", "archived"],
    "expired":  ["archived"],
    "rejected": ["archived"],
    "archived": [],
}

ACTION_TO_STATUS = {
    "publish": "demo", "send": "sent", "accept": "accepted",
    "activate": "active", "suspend": "suspended",
    "reactivate": "active", "archive": "archived",
}

def _find(id: str) -> dict | None:
    return next((b for b in _businesses if b["id"] == id), None)

@router.get("/admin/businesses")
def list_businesses(status: str | None = None):
    results = _businesses if not status else [b for b in _businesses if b["status"] == status]
    return {"businesses": results, "total": len(results)}

# ── Item CRUD (specific routes BEFORE /{action}) ───────────────────────────────

@router.get("/admin/businesses/{id}/items")
def list_items(id: str):
    business = _find(id)
    if not business:
        raise HTTPException(status_code=404, detail=f"Business '{id}' not found")
    return {"items": business.get("items", [])}

@router.post("/admin/businesses/{id}/items")
def add_item(id: str, item: dict):
    business = _find(id)
    if not business:
        raise HTTPException(status_code=404, detail=f"Business '{id}' not found")
    items = business.setdefault("items", [])
    new_item = {
        "id": f"item-new-{int(datetime.now(timezone.utc).timestamp()) % 100000}",
        "businessId": id,
        "name": item.get("name", ""),
        "price": float(item.get("price", 0)),
        "currency": "MXN",
        "description": item.get("description"),
        "visible": item.get("visible", True),
        "order": len(items) + 1,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    items.append(new_item)
    business["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return new_item

@router.patch("/admin/businesses/{id}/items/{item_id}")
def update_item(id: str, item_id: str, patch: dict):
    business = _find(id)
    if not business:
        raise HTTPException(status_code=404, detail=f"Business '{id}' not found")
    item = next((i for i in business.get("items", []) if i["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")
    for key in ("name", "price", "description", "visible", "order"):
        if key in patch:
            item[key] = patch[key]
    item["updatedAt"] = datetime.now(timezone.utc).isoformat()
    business["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return item

@router.delete("/admin/businesses/{id}/items/{item_id}")
def delete_item(id: str, item_id: str):
    business = _find(id)
    if not business:
        raise HTTPException(status_code=404, detail=f"Business '{id}' not found")
    items = business.get("items", [])
    idx = next((i for i, item in enumerate(items) if item["id"] == item_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail=f"Item '{item_id}' not found")
    removed = items.pop(idx)
    business["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return {"deleted": removed["id"]}

# ── Business lifecycle action (generic — AFTER specific routes) ────────────────

@router.post("/admin/businesses/{id}/{action}")
def business_action(id: str, action: str):
    business = _find(id)
    if not business:
        raise HTTPException(status_code=404, detail=f"Business '{id}' not found")
    new_status = ACTION_TO_STATUS.get(action)
    if not new_status:
        raise HTTPException(status_code=400, detail=f"Unknown action '{action}'")
    allowed = VALID_TRANSITIONS.get(business["status"], [])
    if new_status not in allowed:
        raise HTTPException(status_code=422,
            detail=f"Cannot transition from '{business['status']}' to '{new_status}'")
    business["status"] = new_status
    business["updatedAt"] = datetime.now(timezone.utc).isoformat()
    return business
