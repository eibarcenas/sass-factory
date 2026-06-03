# Sprint 7 — Prospects + Notifications + Image Uploads

| Field | Value |
|---|---|
| Branch | `sprint/7-prospects-images` from `develop` |
| Status | ✅ Done |
| Stack | FastAPI, Firestore, Cloud Storage (GCS), React |
| Initiatives | Sales Engine (US-012, US-015), Business Catalog (US-023) |
| Pre-condition | Sprint 6 merged to `develop` |

---

## Objective

Close the sales loop: when a prospect fills the "Sí, lo quiero" form on the demo storefront, the lead is saved to Firestore and the admin is notified in real time. Also ships image upload to Cloud Storage for product photos and business logos.

---

## Prospect Flow

```
Storefront demo page
  → ProspectModal (name, phone, message)
  → POST /api/v1/prospects  (public endpoint — no auth)
  → Firestore: prospects/{id}
  → Admin polls GET /api/v1/prospects (SUPER_ADMIN only)
```

`/api/v1/prospects` is in `PUBLIC_PREFIXES` — no Firebase token required (storefront has no auth).

---

## Notification in Admin

Admin fetches new prospects on a 30s interval via TanStack Query with `refetchInterval`. A red badge on the sidebar shows the count of unread prospects.

---

## Image Upload

```
Admin (ProductEditor / AppearancePage)
  → POST /api/v1/images/upload  (multipart/form-data)
  → FastAPI: validate MIME + size
  → GCS: gs://catalog-mx-images-{env}/{folder}/{uuid}.{ext}
  → Response: { url: "https://storage.googleapis.com/..." }
```

**Auth required**: `api.upload()` sends `Authorization: Bearer {token}` — same token helper as all other API calls.

### Validation Rules
- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`
- Max size: 2MB
- Folder: `products` or `logos`
- File stored publicly, URL returned and saved on the Firestore document

---

## Key Files

```
apps/catalog-api/app/
├── routers/prospects.py         — POST /api/v1/prospects (public)
│                                  GET  /api/v1/prospects (SUPER_ADMIN)
└── routers/images.py            — POST /api/v1/images/upload

apps/admin-fe/src/components/demos/
├── ImageUpload.tsx              — file picker + preview + success state
└── ProductEditor.tsx            — ImageUpload embedded in edit form

apps/storefront-fe/components/
└── ProspectModal.tsx            — "Sí, lo quiero" form
```

---

## Auth Middleware — PUBLIC_PREFIXES

```python
PUBLIC_PREFIXES = (
    "/api/v1/storefront/",
    "/api/v1/prospects",   # ← prospect submission is public
    "/health",
    "/auth/",
)
```

---

## Image Upload UX States

| State | Visual |
|---|---|
| Idle, no image | `📷 Click to add photo` placeholder |
| Uploading | `⏳ Uploading...` with pulse animation |
| Success | Green border + `✅ Photo uploaded — click Save` (3s auto-clear) |
| Error | Red error message below the input |

---

## Tests

### Unit (Vitest)
- `ImageUpload` shows error for files > 2MB
- `ImageUpload` shows error for invalid MIME types (e.g., PDF)
- `ImageUpload` calls `onUploaded` with the returned URL on success
- `api.upload()` includes `Authorization` header

### Integration (FastAPI)
- `POST /api/v1/images/upload` without auth returns 401
- `POST /api/v1/images/upload` with valid JPEG returns `{ url, filename }`
- `POST /api/v1/images/upload` with 3MB file returns 400
- `POST /api/v1/prospects` without auth header returns 200 (public)
- `GET /api/v1/prospects` without auth returns 401

### E2E (Playwright)
```
prospects.spec.ts
  ✓ demo page shows prospect form after clicking CTA
  ✓ form submission shows success message
  ✓ submitted prospect appears in admin prospects list

image-upload.spec.ts
  ✓ product editor shows thumbnail after upload
  ✓ uploading a PDF shows "Invalid type" error
  ✓ uploading a 3MB image shows "File too large" error
```

---

## Acceptance Criteria

- [ ] Prospect form on `/demo/{slug}` submits without authentication
- [ ] Submitted prospect appears in admin under Prospects tab
- [ ] Image upload from ProductEditor sends auth token and saves URL
- [ ] Product row shows uploaded image as 40×40 thumbnail
- [ ] Upload of invalid MIME shows error inline (no page reload)
- [ ] Upload of file > 2MB shows error inline
- [ ] `pnpm typecheck` passes with zero errors
