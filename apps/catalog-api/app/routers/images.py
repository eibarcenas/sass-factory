import asyncio
import os
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File
from google.cloud import storage

router = APIRouter(tags=["images"])

BUCKET_NAME = os.getenv("GCS_BUCKET", "catalog-mx-images")
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 2 * 1024 * 1024  # 2MB

# Module-level singleton: initialized once on first request, reused thereafter.
_gcs_client: "storage.Client | None" = None


def _get_bucket() -> "storage.Bucket":
    global _gcs_client
    if _gcs_client is None:
        _gcs_client = storage.Client()
    return _gcs_client.bucket(BUCKET_NAME)


def _sync_upload(content: bytes, filename: str, content_type: str) -> str:
    """Blocking GCS upload — called via asyncio.to_thread to avoid blocking the event loop."""
    blob = _get_bucket().blob(filename)
    blob.upload_from_string(content, content_type=content_type)
    try:
        # Works with fine-grained ACL buckets. Buckets with Uniform bucket-level
        # access use IAM-level allUsers bindings instead — make_public() is a no-op
        # for them and would raise; swallow silently so the upload still succeeds.
        blob.make_public()
    except Exception:
        pass
    return f"https://storage.googleapis.com/{BUCKET_NAME}/{filename}"


@router.post("/images/upload")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "products",
):
    """Upload image to Cloud Storage. Returns public URL."""
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail=f"Invalid type: {file.content_type}. Use JPEG, PNG, WebP.")

    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large ({len(content)//1024}KB). Max 2MB.")

    # Validate magic bytes (not just content-type header)
    is_jpeg = content[:2] == b'\xff\xd8'
    is_png  = content[:4] == b'\x89PNG'
    is_webp = len(content) >= 12 and content[:4] == b'RIFF' and content[8:12] == b'WEBP'
    if not (is_jpeg or is_png or is_webp):
        raise HTTPException(status_code=400, detail="File content does not match declared type.")

    ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(file.content_type, "jpg")
    filename = f"{folder}/{uuid.uuid4().hex}.{ext}"

    try:
        public_url = await asyncio.to_thread(_sync_upload, content, filename, file.content_type)
        return {"url": public_url, "filename": filename}
    except Exception:
        if os.getenv("GCS_DEV_FALLBACK", "false") != "true":
            raise HTTPException(status_code=500, detail="Image upload failed")
        return {
            "url": f"https://via.placeholder.com/400x400?text={folder}",
            "filename": filename,
            "dev_mode": True,
        }
