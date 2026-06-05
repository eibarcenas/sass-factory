"""
Prospect endpoint tests.
POST /api/v1/prospects is public (no auth).
GET  /api/v1/platform/prospects requires auth.
"""
import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def db():
    mock = MagicMock()
    doc_ref = MagicMock()
    doc_ref.id = "prospect-abc"
    mock.collection.return_value.document.return_value = doc_ref
    mock.collection.return_value.stream.return_value = iter([])
    mock.collection.return_value.order_by.return_value = mock.collection.return_value
    mock.collection.return_value.limit.return_value = mock.collection.return_value
    biz_doc = MagicMock()
    biz_doc.exists = True
    biz_doc.to_dict.return_value = {"prospectCount": 0}
    mock.collection.return_value.document.return_value.get.return_value = biz_doc
    return mock


@pytest.fixture
def public_client():
    """No auth bypass — simulates storefront (public)."""
    with patch.dict(os.environ, {"DEV_USER_EMAIL": ""}):
        from main import app
        yield TestClient(app)


@pytest.fixture
def authed_client():
    with patch.dict(os.environ, {"DEV_USER_EMAIL": "dev@test.local", "ENVIRONMENT": "local"}):
        from main import app
        yield TestClient(app)


# ---------------------------------------------------------------------------
# POST /api/v1/prospects — public
# ---------------------------------------------------------------------------

def test_create_prospect_no_auth_succeeds(public_client, db):
    with patch("app.application.use_cases.prospects.get_db", return_value=db):
        resp = public_client.post("/api/v1/prospects", json={
            "businessId": "biz-123",
            "contactName": "Maria",
            "phone": "+521234567890",
        })
    assert resp.status_code in (200, 201)


def test_create_prospect_missing_contact_returns_400(public_client, db):
    with patch("app.application.use_cases.prospects.get_db", return_value=db):
        resp = public_client.post("/api/v1/prospects", json={
            "businessId": "biz-123",
            "contactName": "Maria",
        })
    assert resp.status_code == 400


def test_create_prospect_email_only_succeeds(public_client, db):
    with patch("app.application.use_cases.prospects.get_db", return_value=db):
        resp = public_client.post("/api/v1/prospects", json={
            "businessId": "biz-123",
            "email": "maria@example.com",
        })
    assert resp.status_code in (200, 201)


# ---------------------------------------------------------------------------
# GET /api/v1/platform/prospects — requires auth
# ---------------------------------------------------------------------------

def test_list_prospects_no_auth_returns_401(public_client, db):
    with patch("app.application.use_cases.prospects.get_db", return_value=db):
        resp = public_client.get("/api/v1/platform/prospects")
    assert resp.status_code == 401


def test_list_prospects_authed_returns_list(authed_client, db):
    with patch("app.application.use_cases.prospects.get_db", return_value=db):
        resp = authed_client.get("/api/v1/platform/prospects")
    assert resp.status_code == 200
