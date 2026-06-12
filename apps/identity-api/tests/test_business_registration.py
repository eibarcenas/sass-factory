from unittest.mock import MagicMock, patch

import pytest
from factory_auth import Role, UserContext, get_current_user
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.routers.auth import BusinessRegistrationRequest
from main import app


def valid_registration():
    return {
        "businessName": "Cocina Norte",
        "type": "restaurante",
        "whatsapp": "+525512345678",
        "city": "Monterrey",
        "state": "Nuevo León",
        "contactName": "Ana Pérez",
        "logo": "https://example.com/logo.jpg",
        "acceptedTerms": True,
        "products": [{
            "name": "Tacos",
            "price": 95,
            "description": "Orden de tres tacos",
            "images": ["https://example.com/tacos.jpg"],
        }],
    }


def test_complete_registration_is_valid():
    registration = BusinessRegistrationRequest.model_validate(valid_registration())

    assert registration.businessName == "Cocina Norte"
    assert registration.acceptedTerms is True
    assert len(registration.products) == 1


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("logo", ""),
        ("contactName", ""),
        ("whatsapp", ""),
        ("city", ""),
        ("state", ""),
        ("acceptedTerms", False),
        ("products", []),
    ],
)
def test_registration_rejects_missing_required_information(field, value):
    payload = valid_registration()
    payload[field] = value

    with pytest.raises(ValidationError):
        BusinessRegistrationRequest.model_validate(payload)


@pytest.mark.parametrize(
    "product_patch",
    [
        {"description": ""},
        {"price": 0},
        {"images": []},
    ],
)
def test_registration_rejects_incomplete_products(product_patch):
    payload = valid_registration()
    payload["products"][0].update(product_patch)

    with pytest.raises(ValidationError):
        BusinessRegistrationRequest.model_validate(payload)


def _override_user(user):
    app.dependency_overrides[get_current_user] = lambda: user


def _no_existing_business():
    db = MagicMock()
    biz_doc = MagicMock()
    biz_doc.exists = False
    db.collection.return_value.document.return_value.get.return_value = biz_doc
    return db


def test_registration_succeeds_for_unassigned_user():
    """A brand-new sign-in (no Firebase custom claims yet, role="") must be
    able to complete onboarding instead of hitting the "Account already
    active" 409."""
    _override_user(UserContext(
        firebase_uid="new-uid",
        email="new@example.com",
        role="",
        business_id=None,
        modules=[],
    ))
    try:
        with (
            patch("app.routers.auth.get_db", return_value=_no_existing_business()),
            patch("app.routers.auth.get_firebase_app"),
            patch("firebase_admin.auth.set_custom_user_claims"),
        ):
            response = TestClient(app).post(
                "/api/v1/business-registrations", json=valid_registration()
            )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 200
    assert response.json()["provisioned"] is True


def test_registration_rejects_already_active_account():
    _override_user(UserContext(
        firebase_uid="owner-uid",
        email="owner@example.com",
        role=Role.OWNER,
        business_id="heladeria-el-pinguino",
        modules=["CATALOG", "APPEARANCE"],
    ))
    try:
        with patch("app.routers.auth.get_db", return_value=_no_existing_business()):
            response = TestClient(app).post(
                "/api/v1/business-registrations", json=valid_registration()
            )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == 409
