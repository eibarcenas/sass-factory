"""
API tests — Firestore is mocked so no GCP credentials required in CI.
The mock returns realistic data matching the Firestore data model.
"""
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient


def make_mock_db(businesses: list[dict] | None = None):
    """Build a Firestore client mock with the given business data."""
    if businesses is None:
        businesses = [
            {
                "slug": "heladeria-pinguino",
                "name": "Heladería El Pingüino",
                "type": "heladeria",
                "whatsapp": "+521234567890",
                "city": "Monterrey",
                "tagline": "La mejor heladería artesanal",
                "theme": {"primary": "#06b6d4", "emoji": "🍦"},
                "status": "demo",
                "plan": "free",
                "createdAt": "2026-01-01T00:00:00Z",
                "updatedAt": "2026-01-01T00:00:00Z",
            }
        ]

    mock_items = [
        {"name": "Sundae de chocolate", "price": 85.0, "currency": "MXN",
         "visible": True, "order": 1, "businessId": "heladeria-pinguino"},
        {"name": "Nieve de vainilla", "price": 40.0, "currency": "MXN",
         "visible": True, "order": 2, "businessId": "heladeria-pinguino"},
    ]

    def make_doc(data: dict, doc_id: str):
        doc = MagicMock()
        doc.exists = True
        doc.id = doc_id
        doc.to_dict.return_value = data

        # items subcollection
        item_docs = []
        for i, item in enumerate(mock_items):
            idoc = MagicMock()
            idoc.id = f"item-{i+1}"
            idoc.to_dict.return_value = item
            item_docs.append(idoc)

        items_col = MagicMock()
        items_col.order_by.return_value = items_col
        items_col.stream.return_value = iter(item_docs)
        items_col.document.return_value.set.return_value = None

        doc.reference.collection.return_value = items_col
        return doc

    db = MagicMock()

    # collection("businesses").document(slug).get() → doc
    def get_doc(slug):
        biz = next((b for b in businesses if b["slug"] == slug), None)
        if biz:
            return make_doc(biz, slug)
        not_found = MagicMock()
        not_found.exists = False
        return not_found

    biz_col = MagicMock()
    biz_col.document.side_effect = lambda slug: MagicMock(
        get=lambda: get_doc(slug),
        collection=lambda _: MagicMock(
            order_by=lambda _: MagicMock(stream=lambda: iter([])),
            document=lambda: MagicMock(set=lambda d: None, id="new-item"),
        ),
    )
    biz_col.stream.return_value = iter([
        make_doc(b, b["slug"]) for b in businesses
    ])
    biz_col.where.return_value = biz_col
    biz_col.order_by.return_value = biz_col

    db.collection.return_value = biz_col
    return db


@pytest.fixture(autouse=True)
def mock_firestore():
    """Auto-mock Firestore for every test — no GCP credentials needed.
    Patches the local import reference in each router, not app.db.get_db,
    to avoid lru_cache and local-reference issues.
    """
    db = make_mock_db()
    with (
        patch("app.routers.storefront.get_db",       return_value=db),
        patch("app.services.business_service.get_db", return_value=db),
        patch("app.services.prospect_service.get_db", return_value=db),
        patch("app.routers.images.storage",           MagicMock()),
    ):
        yield


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_health_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_storefront_known_slug(client):
    response = client.get("/api/v1/storefront/heladeria-pinguino")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "heladeria-pinguino"
    assert len(data["items"]) > 0


def test_storefront_unknown_slug(client):
    response = client.get("/api/v1/storefront/unknown-business")
    assert response.status_code == 404


def test_list_businesses(client):
    response = client.get("/api/v1/admin/businesses")
    assert response.status_code == 200
    assert "businesses" in response.json()
    assert "total" in response.json()


def test_health_has_version(client):
    response = client.get("/health")
    data = response.json()
    assert "version" in data
    assert "timestamp" in data
