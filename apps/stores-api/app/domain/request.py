from enum import Enum


class RequestStatus(str, Enum):
    PENDING   = "pending"
    REVIEWING = "reviewing"
    APPROVED  = "approved"
