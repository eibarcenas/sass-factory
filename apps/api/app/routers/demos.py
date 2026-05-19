from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone
import re

router = APIRouter(tags=["demos"])

from app.routers.businesses import _businesses

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

class CreateDemoRequest(BaseModel):
    name: str
    type: str
    whatsapp: str
    city: str
    tagline: str | None = None

def slugify(text: str) -> str:
    t = text.lower()
    for a, b in [("á","a"),("é","e"),("í","i"),("ó","o"),("ú","u"),("ñ","n"),("ü","u")]:
        t = t.replace(a, b)
    t = re.sub(r"[^a-z0-9\s-]", "", t)
    return re.sub(r"\s+", "-", t.strip())[:40]

@router.post("/admin/demos")
def create_demo(body: CreateDemoRequest):
    slug = slugify(body.name)
    if any(b["id"] == slug for b in _businesses):
        slug = f"{slug}-{int(datetime.now(timezone.utc).timestamp()) % 10000}"

    now = datetime.now(timezone.utc).isoformat()
    business = {
        "id": slug, "slug": slug, "name": body.name, "type": body.type,
        "whatsapp": body.whatsapp, "city": body.city, "tagline": body.tagline,
        "theme": THEMES.get(body.type, THEMES["otro"]),
        "status": "demo", "plan": "free", "createdAt": now, "updatedAt": now,
    }
    _businesses.append(business)
    return business
