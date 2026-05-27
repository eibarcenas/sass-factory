from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
import re
from app.db import get_db
from app.models.enums import BusinessStatus
from app.config.demos import THEMES, SAMPLE_ITEMS

router = APIRouter(tags=["demos"])

def slugify(text: str) -> str:
    t = text.lower()
    for a, b in [("á","a"),("é","e"),("í","i"),("ó","o"),("ú","u"),("ñ","n"),("ü","u")]:
        t = t.replace(a, b)
    t = re.sub(r"[^a-z0-9\s-]", "", t)
    return re.sub(r"\s+", "-", t.strip())[:40]

class CreateDemoRequest(BaseModel):
    name: str
    type: str
    whatsapp: str
    city: str
    tagline: str | None = None

@router.post("/admin/demos")
def create_demo(body: CreateDemoRequest):
    db = get_db()
    slug = slugify(body.name)

    # Ensure uniqueness
    existing = db.collection("businesses").document(slug).get()
    if existing.exists:
        slug = f"{slug}-{int(datetime.now(timezone.utc).timestamp()) % 10000}"

    now = datetime.now(timezone.utc).isoformat()
    business_data = {
        "slug": slug,
        "name": body.name,
        "type": body.type,
        "whatsapp": body.whatsapp,
        "city": body.city,
        "tagline": body.tagline,
        "theme": THEMES.get(body.type, THEMES["otro"]),
        "status": BusinessStatus.DEMO,
        "plan": "free",
        "createdAt": now,
        "updatedAt": now,
    }

    # Write business document
    biz_ref = db.collection("businesses").document(slug)
    biz_ref.set(business_data)

    # Write items as subcollection
    templates = SAMPLE_ITEMS.get(body.type, SAMPLE_ITEMS["otro"])
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


# ── Activate owner account (Google Auth — no password needed) ───────────────

class CreateOwnerRequest(BaseModel):
    email: str
    businessId: str

@router.post("/admin/owners")
def activate_owner(body: CreateOwnerRequest):
    """Pre-register an owner by email so they can sign in with Google.

    With Google Auth, we don't create a password account.
    Instead, we store the email → role mapping in Firestore.
    When the owner signs in with Google, the backend checks this
    mapping and sets their custom claims.

    Flow:
    1. Admin calls this endpoint with owner's Google email
    2. Mapping saved to Firestore: pending_owners/{email}
    3. Owner signs in with Google → backend finds mapping → sets OWNER claims
    4. Owner is redirected to /owner dashboard
    """
    try:
        import firebase_admin
        from firebase_admin import auth as fa

        if not firebase_admin._apps:
            from app.db import get_db
            get_db()

        # Try to find or create the Firebase user by email
        try:
            user = fa.get_user_by_email(body.email)
        except fa.UserNotFoundError:
            # User hasn't signed in yet — create a placeholder account
            # They'll link it when they sign in with Google
            user = fa.create_user(email=body.email)

        # Set custom claims immediately
        fa.set_custom_user_claims(user.uid, {
            "role": "OWNER",
            "business_id": body.businessId,
            "modules": ["CATALOG", "APPEARANCE"],
        })

        # Update Firestore business
        from app.db import get_db
        db = get_db()
        db.collection("businesses").document(body.businessId).update({
            "ownerId": user.uid,
            "ownerEmail": body.email,
            "status": BusinessStatus.ACTIVE,
        })

        # Also store in pending_owners for when they sign in with Google
        db.collection("pending_owners").document(body.email).set({
            "email": body.email,
            "businessId": body.businessId,
            "role": "OWNER",
            "modules": ["CATALOG", "APPEARANCE"],
            "activatedAt": datetime.now(timezone.utc).isoformat(),
        })

    except Exception as e:
        # Dev mode — just store in Firestore if available
        try:
            from app.db import get_db
            db = get_db()
            db.collection("pending_owners").document(body.email).set({
                "email": body.email,
                "businessId": body.businessId,
                "role": "OWNER",
                "modules": ["CATALOG", "APPEARANCE"],
            })
            db.collection("businesses").document(body.businessId).update({
                "ownerEmail": body.email,
                "status": BusinessStatus.ACTIVE,
            })
        except Exception:
            pass  # Firestore not available in this test env

    return {
        "email": body.email,
        "businessId": body.businessId,
        "message": f"Owner activated. Ask {body.email} to sign in with Google.",
    }


# ── Public demo self-acceptance ─────────────────────────────────────────────

class AcceptDemoRequest(BaseModel):
    email: str
    name: str | None = None

@router.post("/demos/{slug}/accept")
def accept_demo(slug: str, body: AcceptDemoRequest):
    """Public — called from the demo page when the owner decides to activate.

    Creates pending_owners/{email} so that resolve-claims picks it up
    on first Google sign-in. Advances business status DEMO → ACCEPTED.
    """
    if not body.email:
        raise HTTPException(status_code=400, detail="Email is required")

    db = get_db()
    biz_ref = db.collection("businesses").document(slug)
    biz_doc = biz_ref.get()

    if not biz_doc.exists:
        raise HTTPException(status_code=404, detail="Demo not found")

    biz_data = biz_doc.to_dict()
    if biz_data.get("status") != BusinessStatus.DEMO:
        return {"accepted": True, "alreadyActive": True}

    now = datetime.now(timezone.utc).isoformat()

    db.collection("pending_owners").document(body.email).set({
        "email": body.email,
        "businessId": slug,
        "role": "OWNER",
        "modules": ["CATALOG", "APPEARANCE"],
        "ownerName": body.name,
        "createdAt": now,
    })

    biz_ref.update({
        "ownerEmail": body.email,
        "status": BusinessStatus.ACCEPTED,
        "acceptedAt": now,
        "updatedAt": now,
    })

    return {"accepted": True}
