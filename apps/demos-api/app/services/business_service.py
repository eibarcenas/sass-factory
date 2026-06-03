"""Legacy import path for business use cases."""
from app.application.use_cases.businesses import (
    get_business_or_404,
    list_businesses,
    owner_approve,
    transition_status,
    update_business_fields,
)
