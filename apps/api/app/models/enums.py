from enum import Enum


class BusinessStatus(str, Enum):
    DRAFT     = "draft"
    DEMO      = "demo"
    SENT      = "sent"
    ACCEPTED  = "accepted"
    ACTIVE    = "active"
    SUSPENDED = "suspended"
    EXPIRED   = "expired"
    REJECTED  = "rejected"
    ARCHIVED  = "archived"


class BusinessType(str, Enum):
    HELADERIA   = "heladeria"
    BARBERIA    = "barberia"
    ESTETICA    = "estetica"
    RESTAURANTE = "restaurante"
    PANADERIA   = "panaderia"
    GYM         = "gym"
    MECANICO    = "mecanico"
    OTRO        = "otro"
