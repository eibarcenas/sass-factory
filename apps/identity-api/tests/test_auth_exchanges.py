from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from main import app


def test_consume_exchange_initializes_firebase_and_returns_custom_token():
    exchange_ref = MagicMock()
    exchange_doc = MagicMock()
    exchange_doc.exists = True
    exchange_doc.to_dict.return_value = {
        "uid": "owner-uid",
        "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=1),
        "consumedAt": None,
    }
    exchange_ref.get.return_value = exchange_doc

    db = MagicMock()
    db.collection.return_value.document.return_value = exchange_ref
    firebase_app = MagicMock()

    with (
        patch("app.routers.auth.get_db", return_value=db),
        patch("firebase_admin._apps", {}),
        patch("firebase_admin.initialize_app", return_value=firebase_app) as initialize_app,
        patch("firebase_admin.auth.create_custom_token", return_value=b"custom-token") as create_custom_token,
        patch.dict("os.environ", {"FIREBASE_AUTH_PROJECT_ID": "catalog-mx-dev"}),
    ):
        response = TestClient(app).post("/api/v1/auth/exchanges/test-code/consume")

    assert response.status_code == 200
    assert response.json() == {"customToken": "custom-token"}
    initialize_app.assert_called_once_with(options={"projectId": "catalog-mx-dev"})
    create_custom_token.assert_called_once_with("owner-uid", app=firebase_app)
    exchange_ref.update.assert_called_once()


def test_consume_exchange_rejects_expired_code():
    exchange_ref = MagicMock()
    exchange_doc = MagicMock()
    exchange_doc.exists = True
    exchange_doc.to_dict.return_value = {
        "uid": "owner-uid",
        "expiresAt": datetime.now(timezone.utc) - timedelta(seconds=1),
        "consumedAt": None,
    }
    exchange_ref.get.return_value = exchange_doc

    db = MagicMock()
    db.collection.return_value.document.return_value = exchange_ref

    with patch("app.routers.auth.get_db", return_value=db):
        response = TestClient(app).post("/api/v1/auth/exchanges/test-code/consume")

    assert response.status_code == 410
    assert response.json() == {"detail": "Exchange expired"}
