from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_storefront_known_slug():
    response = client.get("/api/v1/storefront/heladeria-pinguino")
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "heladeria-pinguino"
    assert len(data["items"]) > 0

def test_storefront_unknown_slug():
    response = client.get("/api/v1/storefront/unknown-business")
    assert response.status_code == 404
