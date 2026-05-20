from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone
import re
from app.db import get_db

router = APIRouter(tags=["demos"])

THEMES = {
    "heladeria":   {"primary": "#06b6d4", "secondary": "#cffafe", "accent": "#f59e0b", "background": "#f0fdfe", "font": "Quicksand", "emoji": "🍦"},
    "barberia":    {"primary": "#1f2937", "secondary": "#6b7280", "accent": "#f59e0b", "background": "#f9fafb", "font": "Oswald", "emoji": "💈"},
    "estetica":    {"primary": "#db2777", "secondary": "#fbcfe8", "accent": "#f59e0b", "background": "#fdf2f8", "font": "Cormorant Garamond", "emoji": "💅"},
    "restaurante": {"primary": "#b91c1c", "secondary": "#fecaca", "accent": "#15803d", "background": "#fff7f7", "font": "Playfair Display", "emoji": "🍽️"},
    "panaderia":   {"primary": "#b45309", "secondary": "#fde68a", "accent": "#f97316", "background": "#fffbeb", "font": "Pacifico", "emoji": "🥐"},
    "gym":         {"primary": "#1d4ed8", "secondary": "#bfdbfe", "accent": "#22c55e", "background": "#eff6ff", "font": "Bebas Neue", "emoji": "💪"},
    "mecanico":    {"primary": "#374151", "secondary": "#9ca3af", "accent": "#f97316", "background": "#f9fafb", "font": "Oswald", "emoji": "🔧"},
    "otro":        {"primary": "#6366f1", "secondary": "#a5b4fc", "accent": "#f59e0b", "background": "#f0f1ff", "font": "Inter", "emoji": "🏪"},
}

SAMPLE_ITEMS: dict[str, list[dict]] = {
    "heladeria": [
        {"name": "Sundae de chocolate",  "price": 85,  "description": "3 scoops of artisan chocolate ice cream with whipped cream and cherry"},
        {"name": "Nieve de vainilla",    "price": 40,  "description": "Classic artisan vanilla ice cream"},
        {"name": "Malteada de fresa",    "price": 65,  "description": "Creamy strawberry milkshake with real fruit"},
        {"name": "Paleta de mango",      "price": 30,  "description": "Natural mango popsicle with chili"},
    ],
    "barberia": [
        {"name": "Corte clásico",        "price": 120, "description": "Classic haircut with styling"},
        {"name": "Corte + barba",        "price": 180, "description": "Haircut and beard trim"},
        {"name": "Arreglo de barba",     "price": 80,  "description": "Beard shaping and styling"},
        {"name": "Corte degradado",      "price": 150, "description": "Modern fade haircut"},
    ],
    "estetica": [
        {"name": "Corte de cabello",     "price": 150, "description": "Haircut and styling"},
        {"name": "Tinte completo",       "price": 450, "description": "Full color treatment"},
        {"name": "Manicure",             "price": 120, "description": "Classic manicure with polish"},
        {"name": "Pedicure",             "price": 150, "description": "Relaxing pedicure treatment"},
    ],
    "restaurante": [
        {"name": "Tacos de bistec",      "price": 65,  "description": "3 beef tacos with onion, cilantro and salsa"},
        {"name": "Quesadilla",           "price": 55,  "description": "Large flour tortilla with melted cheese"},
        {"name": "Enchiladas verdes",    "price": 85,  "description": "3 green enchiladas with chicken and cream"},
        {"name": "Agua fresca",          "price": 25,  "description": "Seasonal fresh water"},
    ],
    "panaderia": [
        {"name": "Concha",               "price": 18,  "description": "Traditional Mexican sweet bread"},
        {"name": "Croissant de mantequilla", "price": 35, "description": "Buttery flaky croissant"},
        {"name": "Pay de queso",         "price": 45,  "description": "Slice of homemade cheesecake"},
        {"name": "Bolillo",              "price": 8,   "description": "Fresh baked white bread roll"},
    ],
    "gym": [
        {"name": "Mensualidad",          "price": 450, "description": "Full access monthly membership"},
        {"name": "Clase de spinning",    "price": 80,  "description": "1-hour spinning session"},
        {"name": "Personal training",    "price": 350, "description": "1-hour with certified trainer"},
        {"name": "Plan trimestral",      "price": 1200,"description": "3-month membership"},
    ],
    "mecanico": [
        {"name": "Cambio de aceite",     "price": 350, "description": "Oil change including filter"},
        {"name": "Revisión de frenos",   "price": 200, "description": "Complete brake inspection"},
        {"name": "Alineación y balanceo","price": 300, "description": "Wheel alignment and balancing"},
        {"name": "Diagnóstico general",  "price": 150, "description": "Full vehicle diagnostic scan"},
    ],
    "otro": [
        {"name": "Servicio básico",      "price": 200, "description": "Basic service package"},
        {"name": "Servicio estándar",    "price": 350, "description": "Standard service package"},
        {"name": "Servicio premium",     "price": 500, "description": "Premium service package"},
    ],
}

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
        "status": "demo",
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
            "status": "active",
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
                "status": "active",
            })
        except Exception:
            pass  # Firestore not available in this test env

    return {
        "email": body.email,
        "businessId": body.businessId,
        "message": f"Owner activated. Ask {body.email} to sign in with Google.",
    }
