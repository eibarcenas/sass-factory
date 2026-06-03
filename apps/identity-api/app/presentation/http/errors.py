from fastapi import HTTPException

from app.application.errors import ApplicationError


def raise_http(error: ApplicationError) -> None:
    raise HTTPException(status_code=error.status_code, detail=error.detail)
