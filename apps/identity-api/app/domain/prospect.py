"""Prospect domain — pure Python, no FastAPI, no Firestore."""


def validate_prospect(phone: str | None, email: str | None) -> None:
    """Raise ValueError if neither contact channel is provided."""
    if not phone and not email:
        raise ValueError("At least phone or email is required")
