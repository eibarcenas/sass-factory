"""Demo + owner activation use cases."""
from datetime import datetime, timezone
from fastapi import HTTPException
from app.db import get_db
from app.domain.business import slugify, BusinessStatus
from app.config.demos import THEMES, SAMPLE_ITEMS

COLL = "businesses"


def create_demo(name: str, type: str, whatsapp: str, city: str, tagline: str | None) -> dict:
    db = get_db()
    slug = slugify(name)

    existing = db.collection(COLL).document(slug).get()
    if existing.exists:
        slug = f"{slug}-{int(datetime.now(timezone.utc).timestamp()) % 10000}"

    now = datetime.now(timezone.utc).isoformat()
    business_data = {
        "slug": slug,
        "name": name,
        "type": type,
        "whatsapp": whatsapp,
        "city": city,
        "tagline": tagline,
        "theme": THEMES.get(type, THEMES["otro"]),
        "status": BusinessStatus.DEMO,
        "plan": "free",
        "createdAt": now,
        "updatedAt": now,
    }

    biz_ref = db.collection(COLL).document(slug)
    biz_ref.set(business_data)

    templates = SAMPLE_ITEMS.get(type, SAMPLE_ITEMS["otro"])
    items = []
    for i, t in enumerate(templates):
        item_data = {
            "businessId": slug,
            "name": t["name"],
            "price": float(t["price"]),
            "currency": "MXN",
            "description": t["description"],
            "visible": True,
            "order": i + 1,
            "createdAt": now,
            "updatedAt": now,
        }
        item_ref = biz_ref.collection("items").document()
        item_ref.set(item_data)
        items.append({**item_data, "id": item_ref.id})

    return {**business_data, "id": slug, "items": items}


def activate_owner(email: str, business_id: str) -> dict:
    try:
        import firebase_admin
        from firebase_admin import auth as fa

        if not firebase_admin._apps:
            get_db()

        try:
            user = fa.get_user_by_email(email)
        except fa.UserNotFoundError:
            user = fa.create_user(email=email)

        fa.set_custom_user_claims(user.uid, {
            "role": "OWNER",
            "business_id": business_id,
            "modules": ["CATALOG", "APPEARANCE"],
        })

        db = get_db()
        db.collection(COLL).document(business_id).update({
            "ownerId": user.uid,
            "ownerEmail": email,
            "status": BusinessStatus.ACTIVE,
        })

        db.collection("pending_owners").document(email).set({
            "email": email,
            "businessId": business_id,
            "role": "OWNER",
            "modules": ["CATALOG", "APPEARANCE"],
            "activatedAt": datetime.now(timezone.utc).isoformat(),
        })

    except Exception:
        try:
            db = get_db()
            db.collection("pending_owners").document(email).set({
                "email": email,
                "businessId": business_id,
                "role": "OWNER",
                "modules": ["CATALOG", "APPEARANCE"],
            })
            db.collection(COLL).document(business_id).update({
                "ownerEmail": email,
                "status": BusinessStatus.ACTIVE,
            })
        except Exception:
            pass

    return {
        "email": email,
        "businessId": business_id,
        "message": f"Owner activated. Ask {email} to sign in with Google.",
    }


def accept_demo(slug: str, email: str, name: str | None) -> dict:
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    db = get_db()
    biz_ref = db.collection(COLL).document(slug)
    biz_doc = biz_ref.get()

    if not biz_doc.exists:
        raise HTTPException(status_code=404, detail="Demo not found")

    biz_data = biz_doc.to_dict()
    if biz_data.get("status") != BusinessStatus.DEMO:
        return {"accepted": True, "alreadyActive": True}

    now = datetime.now(timezone.utc).isoformat()

    db.collection("pending_owners").document(email).set({
        "email": email,
        "businessId": slug,
        "role": "OWNER",
        "modules": ["CATALOG", "APPEARANCE"],
        "ownerName": name,
        "createdAt": now,
    })

    biz_ref.update({
        "ownerEmail": email,
        "status": BusinessStatus.ACCEPTED,
        "acceptedAt": now,
        "updatedAt": now,
    })

    return {"accepted": True}
