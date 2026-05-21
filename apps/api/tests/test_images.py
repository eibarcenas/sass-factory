"""
Image upload endpoint tests.
GCS and Firestore are mocked — no GCP credentials required in CI.
Auth is bypassed via DEV_USER_EMAIL env var (local mode).
"""
import io
import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def jpeg_bytes(size: int = 64) -> bytes:
    """Minimal valid JPEG bytes (FF D8 header)."""
    return b"\xff\xd8" + b"\x00" * size


def png_bytes(size: int = 64) -> bytes:
    """Minimal valid PNG bytes (89 50 4E 47 header)."""
    return b"\x89PNG\r\n\x1a\n" + b"\x00" * size


def _make_file(content: bytes, filename: str, content_type: str):
    return ("file", (filename, io.BytesIO(content), content_type))


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def mock_firestore():
    with patch("app.db.get_db", return_value=MagicMock()):
        yield


@pytest.fixture
def client_with_auth():
    """Client with dev auth bypass and GCS dev fallback active."""
    import app.shared.middleware.auth_middleware as mw
    with (
        patch.object(mw, "DEV_USER_EMAIL", "dev@test.local"),
        patch.dict(os.environ, {"ENVIRONMENT": "local", "GCS_DEV_FALLBACK": "true"}),
    ):
        from main import app
        yield TestClient(app)


@pytest.fixture
def client_no_auth():
    """Client with NO auth bypass — DEV_USER_EMAIL absent."""
    import app.shared.middleware.auth_middleware as mw
    with patch.object(mw, "DEV_USER_EMAIL", None):
        from main import app
        yield TestClient(app)


# ---------------------------------------------------------------------------
# Auth tests
# ---------------------------------------------------------------------------

def test_upload_no_auth_returns_401(client_no_auth):
    """Upload without Authorization header must be rejected."""
    content = jpeg_bytes()
    response = client_no_auth.post(
        "/api/v1/images/upload",
        files=[_make_file(content, "photo.jpg", "image/jpeg")],
    )
    assert response.status_code == 401
    assert "detail" in response.json()


# ---------------------------------------------------------------------------
# Input-validation tests (auth bypassed via dev env)
# ---------------------------------------------------------------------------

def test_upload_invalid_mime_returns_400(client_with_auth):
    response = client_with_auth.post(
        "/api/v1/images/upload",
        files=[_make_file(b"GIF89a...", "anim.gif", "image/gif")],
    )
    assert response.status_code == 400
    assert "Invalid type" in response.json()["detail"]


def test_upload_too_large_returns_400(client_with_auth):
    big = jpeg_bytes(size=3 * 1024 * 1024)  # 3MB > 2MB limit
    response = client_with_auth.post(
        "/api/v1/images/upload",
        files=[_make_file(big, "big.jpg", "image/jpeg")],
    )
    assert response.status_code == 400
    assert "too large" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Success path — GCS mocked to succeed
# ---------------------------------------------------------------------------

def test_upload_success_returns_url(client_with_auth):
    """When GCS succeeds the endpoint returns a public URL."""
    mock_blob = MagicMock()
    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_client = MagicMock()
    mock_client.bucket.return_value = mock_bucket

    with patch("app.routers.images.storage.Client", return_value=mock_client):
        response = client_with_auth.post(
            "/api/v1/images/upload",
            files=[_make_file(jpeg_bytes(), "photo.jpg", "image/jpeg")],
        )

    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["url"].startswith("https://storage.googleapis.com/")
    assert "filename" in data
    mock_blob.upload_from_string.assert_called_once()
    mock_blob.make_public.assert_called_once()


def test_upload_png_success(client_with_auth):
    mock_blob = MagicMock()
    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_client = MagicMock()
    mock_client.bucket.return_value = mock_bucket

    with patch("app.routers.images.storage.Client", return_value=mock_client):
        response = client_with_auth.post(
            "/api/v1/images/upload?folder=banners",
            files=[_make_file(png_bytes(), "photo.png", "image/png")],
        )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"].startswith("banners/")
    assert data["filename"].endswith(".png")


def test_upload_uses_folder_param(client_with_auth):
    mock_blob = MagicMock()
    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_client = MagicMock()
    mock_client.bucket.return_value = mock_bucket

    with patch("app.routers.images.storage.Client", return_value=mock_client):
        response = client_with_auth.post(
            "/api/v1/images/upload?folder=menus",
            files=[_make_file(jpeg_bytes(), "x.jpg", "image/jpeg")],
        )

    assert response.json()["filename"].startswith("menus/")


# ---------------------------------------------------------------------------
# GCS failure paths
# ---------------------------------------------------------------------------

def test_upload_gcs_failure_local_returns_placeholder(client_with_auth):
    """In local env, GCS failure returns a placeholder URL (no crash)."""
    with patch("app.routers.images.storage.Client", side_effect=Exception("no credentials")):
        response = client_with_auth.post(
            "/api/v1/images/upload",
            files=[_make_file(jpeg_bytes(), "photo.jpg", "image/jpeg")],
        )

    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert data["url"]  # must not be empty/None
    assert data.get("dev_mode") is True


def test_upload_gcs_failure_prod_returns_500(client_with_auth):
    """GCS_DEV_FALLBACK absent → GCS failure must surface as 500, not a placeholder."""
    with (
        patch.dict(os.environ, {"GCS_DEV_FALLBACK": "false"}),
        patch("app.routers.images.storage.Client", side_effect=Exception("no bucket")),
    ):
        response = client_with_auth.post(
            "/api/v1/images/upload",
            files=[_make_file(jpeg_bytes(), "photo.jpg", "image/jpeg")],
        )

    assert response.status_code == 500
    assert "upload failed" in response.json()["detail"].lower()
