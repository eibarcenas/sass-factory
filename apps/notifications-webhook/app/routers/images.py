from fastapi import APIRouter, HTTPException, UploadFile, File
from google.cloud import storage
from app.db import get_db
import uuid
import os

router = APIRouter(tags=["images"])

BUCKET_NAME = os.getenv("GCS_BUCKET", "catalog-mx-images")
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 2 * 1024 * 1024  # 2MB

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
        client = storage.Client()
        bucket = client.bucket(BUCKET_NAME)
        blob = bucket.blob(filename)
        blob.upload_from_string(content, content_type=file.content_type)
        blob.make_public()
        public_url = f"https://storage.googleapis.com/{BUCKET_NAME}/{filename}"
        return {"url": public_url, "filename": filename}
    except Exception as e:
        if os.getenv("GCS_DEV_FALLBACK", "false") != "true":
            raise HTTPException(status_code=500, detail="Image upload failed")
        # Local dev: GCS not configured, return a placeholder so UI is testable
        return {
            "url": f"https://via.placeholder.com/400x400?text={folder}",
            "filename": filename,
            "dev_mode": True,
        }
