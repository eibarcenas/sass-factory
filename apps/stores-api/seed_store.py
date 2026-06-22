"""Seed heladeria-el-pinguino store business into Firestore (reads FIRESTORE_PROJECT_ID from .env)."""
import logging
import os, sys
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.join(os.path.dirname(__file__), "service-account.json")

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, firestore

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

project_id = os.getenv("FIRESTORE_PROJECT_ID")
if not project_id:
    logger.error("FIRESTORE_PROJECT_ID is not set. Check your .env file.")
    sys.exit(1)

now = datetime.now(timezone.utc).isoformat()

cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
firebase_admin.initialize_app(cred, {"projectId": project_id})
db = firestore.client()

SLUG = "heladeria-el-pinguino"

business = {
    "name": "Heladería El Pingüino",
    "tagline": "Los mejores helados artesanales de la ciudad",
    "slug": SLUG,
    "status": "active",
    "type": "heladeria",
    "whatsapp": "5211234567890",
    "city": "Monterrey",
    "state": "Nuevo León",
    "plan": "free",
    "ownerEmail": "admin@catalog.mx",
    "theme": {
        "primary": "#25D366",
        "secondary": "#0EA5E9",
        "accent": "#FDE047",
        "background": "#F8FAFC",
        "font": "Inter",
        "emoji": "🍦",
        "gradient": ["#25D366", "#0EA5E9"],
    },
    "whatsappClicks": 0,
    "createdAt": now,
    "updatedAt": now,
}

items = [
    {"name": "Helado de Vainilla",      "price": 35.0, "description": "Clasico cremoso de vainilla natural",         "order": 0},
    {"name": "Helado de Chocolate",     "price": 35.0, "description": "Intenso y suave, chocolate 70%",               "order": 1},
    {"name": "Helado de Fresa",         "price": 35.0, "description": "Fresas frescas de temporada",                  "order": 2},
    {"name": "Helado de Mango",         "price": 40.0, "description": "Mango Ataulfo, sabor tropical intenso",        "order": 3},
    {"name": "Nieve de Limon",          "price": 30.0, "description": "Refrescante, con jugo de limon real",          "order": 4},
    {"name": "Copa Especial Pinguino",  "price": 75.0, "description": "3 bolas a eleccion + crema + nuez + fresa",   "order": 5},
    {"name": "Malteada de Chocolate",   "price": 65.0, "description": "Espesa y cremosa, con helado extra",          "order": 6},
    {"name": "Paleta de Mango-Chile",   "price": 25.0, "description": "Dulce, picante y refrescante",                "order": 7},
]

biz_ref = db.collection("businesses").document(SLUG)
biz_ref.set(business)
logger.info("Created business: %s", SLUG)

for item in items:
    doc_ref = biz_ref.collection("items").document()
    doc_ref.set({
        **item,
        "businessId": SLUG,
        "currency": "MXN",
        "visible": True,
        "createdAt": now,
        "updatedAt": now,
    })
    logger.info("  + %s ($%s)", item["name"], item["price"])

logger.info("Done. Visit: https://catalog-mx-store-dev-q3peeste7q-uc.a.run.app/%s", SLUG)
