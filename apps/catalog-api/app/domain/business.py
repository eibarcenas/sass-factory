"""Business domain — pure Python, no FastAPI, no Firestore."""
import re
from enum import Enum


class BusinessStatus(str, Enum):
    PENDING  = "pending"
    ACTIVE   = "active"
    INACTIVE = "inactive"


class BusinessType(str, Enum):
    HELADERIA   = "heladeria"
    BARBERIA    = "barberia"
    ESTETICA    = "estetica"
    RESTAURANTE = "restaurante"
    PANADERIA   = "panaderia"
    GYM         = "gym"
    MECANICO    = "mecanico"
    OTRO        = "otro"


VALID_TRANSITIONS: dict[BusinessStatus, list[BusinessStatus]] = {
    BusinessStatus.PENDING:  [BusinessStatus.ACTIVE],
    BusinessStatus.ACTIVE:   [BusinessStatus.INACTIVE],
    BusinessStatus.INACTIVE: [BusinessStatus.ACTIVE],
}

ACTION_TO_STATUS: dict[str, BusinessStatus] = {
    "activate":   BusinessStatus.ACTIVE,
    "deactivate": BusinessStatus.INACTIVE,
    "reactivate": BusinessStatus.ACTIVE,
}

OWNER_PATCH_FIELDS = frozenset({"tagline", "theme", "name", "whatsapp"})


def resolve_new_status(current: BusinessStatus, action: str) -> BusinessStatus:
    """Return the target status for an action, or raise ValueError."""
    new_status = ACTION_TO_STATUS.get(action)
    if not new_status:
        raise ValueError(f"Unknown action '{action}'")
    allowed = VALID_TRANSITIONS.get(current, [])
    if new_status not in allowed:
        raise ValueError(f"Cannot transition from '{current}' to '{new_status}'")
    return new_status


def slugify(text: str) -> str:
    t = text.lower()
    for a, b in [("á","a"),("é","e"),("í","i"),("ó","o"),("ú","u"),("ñ","n"),("ü","u")]:
        t = t.replace(a, b)
    t = re.sub(r"[^a-z0-9\s-]", "", t)
    return re.sub(r"\s+", "-", t.strip())[:40]
