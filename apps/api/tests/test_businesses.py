"""
Business lifecycle API tests.
Firestore is mocked — no GCP credentials required in CI.
Auth is bypassed via DEV_USER_EMAIL + ENVIRONMENT=local.
Patch the local import reference (app.services.business_service.get_db),
not app.db.get_db, to avoid lru_cache and local-reference issues.
"""
import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_doc(data: dict, doc_id: str):
    doc = MagicMock()
    doc.exists = True
    doc.id = doc_id
    doc.to_dict.return_value = data
    items_col = MagicMock()
    items_col.order_by.return_value = items_col
    items_col.stream.return_value = iter([])
    doc.reference.collection.return_value = items_col
    return doc


def _miss():
    m = MagicMock()
    m.exists = False
    return m


def _db_with(businesses: list[dict]):
    """Build a minimal Firestore mock from a list of business dicts."""
    db = MagicMock()
    col = MagicMock()

    def make_ref(doc_id):
        biz = next((b for b in businesses if b.get("slug") == doc_id), None)
        ref = MagicMock()
        ref.get.return_value = _make_doc(biz, doc_id) if biz else _miss()
        ref.update = MagicMock()
        items_col = MagicMock()
        items_col.order_by.return_value = items_col
        items_col.stream.return_value = iter([])
        ref.collection.return_value = items_col
        return ref

    col.document.side_effect = make_ref
    col.stream.return_value = iter([_make_doc(b, b["slug"]) for b in businesses])
    col.where.return_value = col
    col.order_by.return_value = col
    db.collection.return_value = col
    return db


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    with patch.dict(os.environ, {"DEV_USER_EMAIL": "dev@test.local", "ENVIRONMENT": "local"}):
        from main import app
        yield TestClient(app)


# ---------------------------------------------------------------------------
# List businesses
# ---------------------------------------------------------------------------

def test_list_businesses_returns_all(client):
    db = _db_with([
        {"slug": "a", "name": "A", "status": "draft",  "plan": "free"},
        {"slug": "b", "name": "B", "status": "active", "plan": "pro"},
    ])
    with patch("app.services.business_service.get_db", return_value=db):
        resp = client.get("/api/v1/admin/businesses")
    assert resp.status_code == 200
    assert resp.json()["total"] == 2


def test_list_businesses_requires_auth():
    with patch.dict(os.environ, {"DEV_USER_EMAIL": ""}):
        from main import app
        c = TestClient(app)
        db = _db_with([])
        with patch("app.services.business_service.get_db", return_value=db):
            resp = c.get("/api/v1/admin/businesses")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Status machine — valid transitions
# ---------------------------------------------------------------------------

VALID_TRANSITIONS = [
    ("draft",     "publish"),
    ("demo",      "send"),
    ("sent",      "accept"),
    ("accepted",  "activate"),
    ("active",    "suspend"),
    ("suspended", "reactivate"),
]


@pytest.mark.parametrize("from_status,action", VALID_TRANSITIONS)
def test_valid_status_transition(client, from_status, action):
    db = _db_with([{"slug": "biz-1", "name": "B", "status": from_status, "plan": "free"}])
    with patch("app.services.business_service.get_db", return_value=db):
        resp = client.post(f"/api/v1/admin/businesses/biz-1/{action}")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Status machine — invalid transitions (returns 422)
# ---------------------------------------------------------------------------

INVALID_TRANSITIONS = [
    ("draft",    "activate"),
    ("active",   "publish"),
    ("active",   "accept"),
    ("archived", "publish"),
]


@pytest.mark.parametrize("from_status,action", INVALID_TRANSITIONS)
def test_invalid_status_transition_returns_422(client, from_status, action):
    db = _db_with([{"slug": "biz-1", "name": "B", "status": from_status, "plan": "free"}])
    with patch("app.services.business_service.get_db", return_value=db):
        resp = client.post(f"/api/v1/admin/businesses/biz-1/{action}")
    assert resp.status_code == 422


def test_unknown_business_returns_404(client):
    db = _db_with([])
    with patch("app.services.business_service.get_db", return_value=db):
        resp = client.post("/api/v1/admin/businesses/nonexistent/publish")
    assert resp.status_code == 404
