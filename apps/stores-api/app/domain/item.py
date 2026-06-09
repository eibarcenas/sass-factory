"""Item domain — pure Python, no FastAPI, no Firestore."""

ALLOWED_PATCH_FIELDS = frozenset({"name", "price", "description", "image", "images", "visible", "order"})


def build_new_item(business_id: str, data: dict, order: int, now: str) -> dict:
    return {
        "businessId": business_id,
        "name": data.get("name", ""),
        "price": float(data.get("price", 0)),
        "currency": "MXN",
        "description": data.get("description"),
        "image": data.get("image") or (data.get("images") or [None])[0],
        "images": data.get("images") or [],
        "visible": data.get("visible", True),
        "order": order,
        "createdAt": now,
        "updatedAt": now,
    }
