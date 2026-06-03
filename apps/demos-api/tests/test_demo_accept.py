"""
POST /api/v1/demos/{slug}/accept tests.
Verifies that a demo owner can self-accept, triggering pending_owners creation
and business status advance to ACCEPTED. Public endpoint — no auth required.
"""
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient


def _make_biz_doc(status: str = "demo"):
    doc = MagicMock()
    doc.exists = True
    doc.to_dict.return_value = {"slug": "heladeria-test", "status": status}
    return doc


def _make_missing_doc():
    doc = MagicMock()
    doc.exists = False
    return doc


def _db_with_biz(status: str = "demo"):
    db = MagicMock()
    biz_ref = MagicMock()
    biz_ref.get.return_value = _make_biz_doc(status)
    db.collection.return_value.document.return_value = biz_ref
    return db, biz_ref


def _db_missing():
    db = MagicMock()
    biz_ref = MagicMock()
    biz_ref.get.return_value = _make_missing_doc()
    db.collection.return_value.document.return_value = biz_ref
    return db


@pytest.fixture
def public_client():
    from main import app
    yield TestClient(app)


# ---------------------------------------------------------------------------

def test_accept_demo_creates_pending_owner(public_client):
    db, biz_ref = _db_with_biz("demo")
    with patch("app.application.use_cases.demos.get_db", return_value=db):
        resp = public_client.post(
            "/api/v1/demos/heladeria-test/accept",
            json={"email": "owner@example.com", "name": "María"},
        )
    assert resp.status_code == 200
    assert resp.json()["accepted"] is True

    # pending_owners document was written
    db.collection.assert_any_call("pending_owners")

    # business status was updated
    biz_ref.update.assert_called_once()
    update_payload = biz_ref.update.call_args[0][0]
    assert update_payload["status"] == "accepted"
    assert update_payload["ownerEmail"] == "owner@example.com"


def test_accept_demo_404_when_slug_missing(public_client):
    db = _db_missing()
    with patch("app.application.use_cases.demos.get_db", return_value=db):
        resp = public_client.post(
            "/api/v1/demos/no-such-slug/accept",
            json={"email": "owner@example.com"},
        )
    assert resp.status_code == 404


def test_accept_demo_idempotent_when_already_active(public_client):
    db, biz_ref = _db_with_biz("active")
    with patch("app.application.use_cases.demos.get_db", return_value=db):
        resp = public_client.post(
            "/api/v1/demos/heladeria-test/accept",
            json={"email": "owner@example.com"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["accepted"] is True
    assert data.get("alreadyActive") is True
    biz_ref.update.assert_not_called()
