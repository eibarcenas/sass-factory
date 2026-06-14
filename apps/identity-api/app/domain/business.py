"""Business domain — pure Python, no FastAPI, no Firestore."""
import re
from enum import Enum


class BusinessStatus(str, Enum):
    DRAFT          = "draft"
    # Entry status for self-service registration (mirrors stores-api's
    # BusinessStatus.PENDING). Owned by the stores-api activation flow, so it
    # is not part of identity-api's admin-curated VALID_TRANSITIONS pipeline.
    PENDING        = "pending"
    PENDING_REVIEW = "pending_review"
    REVIEW         = "review"
    DEMO           = "demo"
    SENT           = "sent"
    ACCEPTED       = "accepted"
    ACTIVE         = "active"
    SUSPENDED      = "suspended"
    EXPIRED        = "expired"
    REJECTED       = "rejected"
    ARCHIVED       = "archived"


class Module(str, Enum):
    """Owner-facing feature modules granted via Firebase custom claims."""
    CATALOG    = "CATALOG"
    APPEARANCE = "APPEARANCE"


# Default modules provisioned for a new business owner.
DEFAULT_OWNER_MODULES: list[str] = [Module.CATALOG.value, Module.APPEARANCE.value]

# Statuses for which /auth/claims/resolve may grant OWNER claims. Excludes
# terminal/punitive states (SUSPENDED, REJECTED, EXPIRED, ARCHIVED) so owners
# cannot self-reactivate. Membership matches the raw Firestore string because
# BusinessStatus is a str-enum.
CLAIMABLE_STATUSES: frozenset[BusinessStatus] = frozenset({
    BusinessStatus.PENDING,
    BusinessStatus.DRAFT,
    BusinessStatus.PENDING_REVIEW,
    BusinessStatus.REVIEW,
    BusinessStatus.ACTIVE,
})


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
    BusinessStatus.DRAFT:          [BusinessStatus.PENDING_REVIEW, BusinessStatus.DEMO,     BusinessStatus.ARCHIVED],
    BusinessStatus.PENDING_REVIEW: [BusinessStatus.ACTIVE,         BusinessStatus.ARCHIVED],
    BusinessStatus.REVIEW:         [BusinessStatus.ACTIVE,         BusinessStatus.ARCHIVED],
    BusinessStatus.DEMO:           [BusinessStatus.SENT,           BusinessStatus.ARCHIVED],
    BusinessStatus.SENT:           [BusinessStatus.ACCEPTED,       BusinessStatus.REJECTED, BusinessStatus.EXPIRED],
    BusinessStatus.ACCEPTED:       [BusinessStatus.ACTIVE,         BusinessStatus.ARCHIVED],
    BusinessStatus.ACTIVE:         [BusinessStatus.SUSPENDED,      BusinessStatus.ARCHIVED],
    BusinessStatus.SUSPENDED:      [BusinessStatus.ACTIVE,         BusinessStatus.ARCHIVED],
    BusinessStatus.EXPIRED:        [BusinessStatus.ARCHIVED],
    BusinessStatus.REJECTED:       [BusinessStatus.ARCHIVED],
    BusinessStatus.ARCHIVED:       [],
}

ACTION_TO_STATUS: dict[str, BusinessStatus] = {
    "submit":     BusinessStatus.REVIEW,
    "publish":    BusinessStatus.DEMO,
    "send":       BusinessStatus.SENT,
    "accept":     BusinessStatus.ACCEPTED,
    "activate":   BusinessStatus.ACTIVE,
    "suspend":    BusinessStatus.SUSPENDED,
    "reactivate": BusinessStatus.ACTIVE,
    "archive":    BusinessStatus.ARCHIVED,
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
