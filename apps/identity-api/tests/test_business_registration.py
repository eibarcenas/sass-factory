import os
from unittest.mock import MagicMock, patch

import pytest
from factory_auth import Role, UserContext, get_current_user
from fastapi import status as http_status
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.domain.business import BusinessStatus, BusinessType, DEFAULT_OWNER_MODULES
from app.routers.auth import BusinessRegistrationRequest
from main import app


@pytest.fixture(autouse=True)
def _local_auth_env():
    """AuthMiddleware runs before the route and 401s without a Bearer token.
    DEV_USER_EMAIL + ENVIRONMENT=local makes it pass the request through so
    the get_current_user dependency override supplies the actual test user."""
    with patch.dict(
        os.environ,
        {"DEV_USER_EMAIL": "dev@example.com", "ENVIRONMENT": "local"},
    ):
        yield


def valid_registration():
    return {
        "businessName": "Cocina Norte",
        "type": BusinessType.RESTAURANTE.value,
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
    db = _no_existing_business()
    try:
        with (
            patch("app.routers.auth.get_db", return_value=db),
            patch("app.routers.auth.get_firebase_app"),
            patch("firebase_admin.auth.set_custom_user_claims") as set_claims,
        ):
            response = TestClient(app).post(
                "/api/v1/business-registrations", json=valid_registration()
            )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == http_status.HTTP_200_OK
    assert response.json()["provisioned"] is True

    # The created business must carry the self-registration status the
    # claims/resolve fallback later treats as claimable (the bug being fixed).
    written_business = db.batch.return_value.set.call_args_list[0].args[1]
    assert written_business["status"] == BusinessStatus.PENDING.value

    # OWNER claims must be provisioned with the default modules.
    granted_claims = set_claims.call_args.args[1]
    assert granted_claims["role"] == Role.OWNER.value
    assert granted_claims["modules"] == DEFAULT_OWNER_MODULES


def test_registration_rejects_already_active_account():
    _override_user(UserContext(
        firebase_uid="owner-uid",
        email="owner@example.com",
        role=Role.OWNER,
        business_id="heladeria-el-pinguino",
        modules=DEFAULT_OWNER_MODULES,
    ))
    try:
        with patch("app.routers.auth.get_db", return_value=_no_existing_business()):
            response = TestClient(app).post(
                "/api/v1/business-registrations", json=valid_registration()
            )
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    assert response.status_code == http_status.HTTP_409_CONFLICT
