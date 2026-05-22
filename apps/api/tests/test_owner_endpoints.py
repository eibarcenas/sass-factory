"""
Owner endpoint integration tests.
Tests three auth scenarios for /owner/business/items:
  - OWNER (JWT claims): reads business_id from token, no ?business= needed
  - SUPER_ADMIN + ?business=<slug>: reads the provided slug → 200
  - SUPER_ADMIN, no ?business=: no slug to resolve → 400
"""
import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from app.shared.auth.jwt_models import UserContext, Role


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_items_col(items=None):
    col = MagicMock()
    col.order_by.return_value = col
    col.stream.return_value = iter(items or [])
    col.document.return_value = MagicMock(
        exists=True,
        id="item-1",
        to_dict=lambda: {"name": "Sundae", "price": 85.0, "visible": True, "order": 1},
    )
    return col


def _db_with_business(slug: str):
    db = MagicMock()
    col = MagicMock()
    ref = MagicMock()
    ref.get.return_value = MagicMock(exists=True, id=slug, to_dict=lambda: {"name": "Test", "slug": slug, "status": "demo"})
    ref.update = MagicMock()
    ref.collection.return_value = _make_items_col()
    col.document.return_value = ref
    db.collection.return_value = col
    return db


def _empty_db():
    db = MagicMock()
    col = MagicMock()
    ref = MagicMock()
    ref.get.return_value = MagicMock(exists=False)
    col.document.return_value = ref
    db.collection.return_value = col
    return db


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def super_admin_client():
    """SUPER_ADMIN via dev bypass."""
    import app.shared.middleware.auth_middleware as mw
    with (
        patch.object(mw, "DEV_USER_EMAIL", "dev@test.local"),
        patch.dict(os.environ, {"ENVIRONMENT": "local"}),
    ):
        from main import app
        yield TestClient(app)


@pytest.fixture
def owner_client():
    """OWNER with business_id=heladeria-el-pinguino.
    Uses dev bypass so middleware passes, then overrides get_current_user
    via FastAPI's dependency_overrides to inject OWNER context.
    """
    import app.shared.middleware.auth_middleware as mw
    from app.shared.auth.rbac import get_current_user

    owner = UserContext(
        firebase_uid="owner-uid",
        email="owner@test.local",
        role=Role.OWNER,
        business_id="heladeria-el-pinguino",
        modules=[],
    )

    with (
        patch.object(mw, "DEV_USER_EMAIL", "dev@test.local"),
        patch.dict(os.environ, {"ENVIRONMENT": "local"}),
    ):
        from main import app
        app.dependency_overrides[get_current_user] = lambda: owner
        try:
            yield TestClient(app)
        finally:
            app.dependency_overrides.pop(get_current_user, None)


# ---------------------------------------------------------------------------
# SUPER_ADMIN — GET /owner/business/items
# ---------------------------------------------------------------------------

def test_super_admin_with_business_slug_returns_200(super_admin_client):
    db = _db_with_business("heladeria-el-pinguino")
    with patch("app.routers.businesses.get_db", return_value=db):
        resp = super_admin_client.get("/api/v1/owner/business/items?business=heladeria-el-pinguino")
    assert resp.status_code == 200
    assert "items" in resp.json()


def test_super_admin_without_business_slug_returns_400(super_admin_client):
    db = _db_with_business("heladeria-el-pinguino")
    with patch("app.routers.businesses.get_db", return_value=db):
        resp = super_admin_client.get("/api/v1/owner/business/items")
    assert resp.status_code == 400
    assert "SUPER_ADMIN must provide" in resp.json()["detail"]


# ---------------------------------------------------------------------------
# OWNER — GET /owner/business/items
# ---------------------------------------------------------------------------

def test_owner_reads_from_jwt_claims_returns_200(owner_client):
    db = _db_with_business("heladeria-el-pinguino")
    with patch("app.routers.businesses.get_db", return_value=db):
        resp = owner_client.get("/api/v1/owner/business/items")
    assert resp.status_code == 200
    assert "items" in resp.json()


def test_owner_ignores_business_query_param(owner_client):
    """OWNER: ?business= param is ignored; always uses JWT claims slug."""
    db = _db_with_business("heladeria-el-pinguino")
    with patch("app.routers.businesses.get_db", return_value=db):
        resp = owner_client.get("/api/v1/owner/business/items?business=other-business")
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# SUPER_ADMIN — PATCH /owner/business
# ---------------------------------------------------------------------------

def test_super_admin_patch_business_with_slug_returns_200(super_admin_client):
    db = _db_with_business("heladeria-el-pinguino")
    with patch("app.routers.businesses.get_db", return_value=db):
        resp = super_admin_client.patch(
            "/api/v1/owner/business?business=heladeria-el-pinguino",
            json={"tagline": "La mejor heladería"},
        )
    assert resp.status_code == 200


def test_super_admin_patch_business_without_slug_returns_400(super_admin_client):
    db = _db_with_business("heladeria-el-pinguino")
    with patch("app.routers.businesses.get_db", return_value=db):
        resp = super_admin_client.patch("/api/v1/owner/business", json={"tagline": "test"})
    assert resp.status_code == 400
