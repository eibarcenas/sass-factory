from enum import StrEnum
from pydantic import BaseModel


class Role(StrEnum):
    SUPER_ADMIN = "SUPER_ADMIN"  # Erick — full access to all businesses
    OWNER       = "OWNER"        # Business owner — access to their own business only


class UserStatus(StrEnum):
    INVITED  = "INVITED"
    ACTIVE   = "ACTIVE"
    INACTIVE = "INACTIVE"


class FirebaseClaims(BaseModel):
    uid:        str
    email:      str | None = None
    role:       Role | None = None
    modules:    list[str] = []
    business_id: str | None = None  # set for OWNER role


class UserContext(BaseModel):
    firebase_uid: str
    email:        str | None = None
    role:         Role
    modules:      list[str] = []
    business_id:  str | None = None  # owner's business slug

    @property
    def is_super_admin(self) -> bool:
        return self.role == Role.SUPER_ADMIN

    @property
    def is_owner(self) -> bool:
        return self.role == Role.OWNER

    def can_access_business(self, business_id: str) -> bool:
        if self.is_super_admin:
            return True
        return self.business_id == business_id


# Synthetic user for service-to-service calls
INTERNAL_SERVICE_USER = UserContext(
    firebase_uid="internal-service",
    email="internal@catalog.mx",
    role=Role.SUPER_ADMIN,
    modules=[],
)
