"""
POST /api/v1/auth/claims/resolve tests.
Verifies that owners with no role claim get their Firebase custom claims
set when a pending_owners record exists, and that the endpoint is a no-op
when the record is absent.
"""
from unittest.mock import MagicMock, patch
import os
import pytest
from fastapi.testclient import TestClient
from factory_auth import UserContext, Role


def _make_pending_owner(email: str, business_id: str):
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {
        "email": email,
        "businessId": business_id,
        "role": "OWNER",
        "modules": ["CATALOG", "APPEARANCE"],
    }
    return doc


def _no_pending(email: str):
    doc = MagicMock()
    doc.exists = False
    return doc


@pytest.fixture
def roleless_client():
    """User authenticated with Google but no role claim yet."""
    from factory_auth import get_current_user

    roleless = UserContext(
        firebase_uid="new-owner-uid",
        email="owner@example.com",
        # middleware defaults to OWNER when no role claim in JWT
        role=Role.OWNER,
        business_id=None,
        modules=[],
    )

    from main import app
    app.dependency_overrides[get_current_user] = lambda: roleless
    try:
        with patch.dict(os.environ, {"DEV_USER_EMAIL": "owner@example.com", "ENVIRONMENT": "local"}):
            yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def _db_with_pending(email: str, business_id: str):
    db = MagicMock()
    pending_ref = MagicMock()
    pending_ref.get.return_value = _make_pending_owner(email, business_id)
    db.collection.return_value.document.return_value = pending_ref
    return db


def _db_no_pending():
    db = MagicMock()
    pending_ref = MagicMock()
    pending_ref.get.return_value = _no_pending("owner@example.com")
    db.collection.return_value.document.return_value = pending_ref
    # businesses fallback query returns empty list
    (
        db.collection.return_value
        .where.return_value
        .limit.return_value
        .get.return_value
    ) = []
    return db


def _db_no_pending_but_has_business(
    email: str,
    slug: str,
    uid: str = "new-owner-uid",
    status: str = "review",
):
    db = MagicMock()
    pending_ref = MagicMock()
    pending_ref.get.return_value = _no_pending(email)
    db.collection.return_value.document.return_value = pending_ref

    biz_doc = MagicMock()
    biz_doc.to_dict.return_value = {
        "slug": slug,
        "ownerEmail": email,
        "ownerUid": uid,
        "status": status,
        "name": "Heladería",
    }
    (
        db.collection.return_value
        .where.return_value
        .limit.return_value
        .get.return_value
    ) = [biz_doc]
    return db


# ---------------------------------------------------------------------------

def test_resolve_claims_sets_claims_when_pending(roleless_client):
    db = _db_with_pending("owner@example.com", "heladeria-el-pinguino")
    with (
        patch("app.routers.auth.get_db", return_value=db),
        patch("app.routers.auth.get_firebase_app"),
        patch("firebase_admin.auth.set_custom_user_claims"),
    ):
        resp = roleless_client.post("/api/v1/auth/claims/resolve")
    assert resp.status_code == 200
    data = resp.json()
    assert data["resolved"] is True
    assert data["role"] == "OWNER"
    assert data["businessId"] == "heladeria-el-pinguino"


def test_resolve_claims_noop_when_no_pending(roleless_client):
    db = _db_no_pending()
    with patch("app.routers.auth.get_db", return_value=db):
        resp = roleless_client.post("/api/v1/auth/claims/resolve")
    assert resp.status_code == 200
    assert resp.json()["resolved"] is False


def test_resolve_claims_fallback_to_businesses(roleless_client):
    db = _db_no_pending_but_has_business(
        "owner@example.com", "heladeria-el-pinguino"
    )
    with (
        patch("app.routers.auth.get_db", return_value=db),
        patch("app.routers.auth.get_firebase_app"),
        patch("firebase_admin.auth.set_custom_user_claims"),
    ):
        resp = roleless_client.post("/api/v1/auth/claims/resolve")
    assert resp.status_code == 200
    data = resp.json()
    assert data["resolved"] is True
    assert data["role"] == "OWNER"
    assert data["businessId"] == "heladeria-el-pinguino"


def test_resolve_claims_fallback_blocked_uid_mismatch(roleless_client):
    # Different UID stored in business — must not grant claims
    db = _db_no_pending_but_has_business(
        "owner@example.com", "heladeria-el-pinguino", uid="different-uid"
    )
    with patch("app.routers.auth.get_db", return_value=db):
        resp = roleless_client.post("/api/v1/auth/claims/resolve")
    assert resp.status_code == 200
    assert resp.json()["resolved"] is False


def test_resolve_claims_fallback_blocked_suspended(roleless_client):
    db = _db_no_pending_but_has_business(
        "owner@example.com", "heladeria-el-pinguino", status="suspended"
    )
    with patch("app.routers.auth.get_db", return_value=db):
        resp = roleless_client.post("/api/v1/auth/claims/resolve")
    assert resp.status_code == 403
