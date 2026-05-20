from typing import Annotated
from fastapi import Depends, HTTPException, Request

from .jwt_models import Role, UserContext


def get_current_user(request: Request) -> UserContext:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def require_role(*roles: Role):
    def dependency(user: Annotated[UserContext, Depends(get_current_user)]) -> UserContext:
        if user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{user.role}' is not authorized. Required: {[r.value for r in roles]}",
            )
        return user
    return dependency


def require_super_admin():
    return require_role(Role.SUPER_ADMIN)


def require_owner_or_admin():
    return require_role(Role.SUPER_ADMIN, Role.OWNER)


def require_business_access(business_id_param: str = "id"):
    """Ensures OWNER can only access their own business; SUPER_ADMIN can access all."""
    def dependency(
        request: Request,
        user: Annotated[UserContext, Depends(get_current_user)],
    ) -> UserContext:
        business_id = request.path_params.get(business_id_param)
        if business_id and not user.can_access_business(business_id):
            raise HTTPException(status_code=403, detail="Access denied to this business")
        return user
    return dependency
