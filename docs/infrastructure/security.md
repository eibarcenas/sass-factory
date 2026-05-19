# Security

## Authentication Flow

```
Admin → /login
    │
    ▼
Firebase Auth (email/password for admin, MVP)
    │
    ▼
JWT token stored in httpOnly cookie
    │
    ▼
Next.js middleware verifies token on every /admin/* request
    │
    ├── has permission businesses:read:any  → allow (from Custom Claims, not Firestore)
    └── else                                → redirect /login
```

## Role Management — Custom Claims (not Firestore fields)

Admin role MUST live in Firebase Custom Claims, not in `users/{uid}.role`.

```
WHY: A Firestore field can be written if rules have a bug.
     Custom Claims are set server-side only (Firebase Admin SDK).
     A tenant can never promote themselves to admin via a Firestore write.

HOW:
  // Server-side only — Admin SDK
  await admin.auth().setCustomUserClaims(uid, {
    permissions: ROLE_PERMISSIONS['admin']
  })

  // In Next.js middleware — from decoded token, not DB
  const token = await adminAuth.verifyIdToken(jwt)
  // token.permissions contains the permissions array from claims

  // In FastAPI — from decoded token
  permissions = decoded_token.get("permissions", [])
  if "businesses:read:any" not in permissions:
      raise ForbiddenError()
```

## Secret Management

All secrets stored in Google Secret Manager. Never in environment files in production.

```
Secret                        Name in Secret Manager
────────────────────────────────────────────────────
Firebase service account key  firebase-admin-sdk-key
Firebase Web API key          firebase-web-api-key
GA4 Measurement ID            ga4-measurement-id

Access pattern (Firebase App Hosting):
  apphosting.yaml references secrets by name →
  Firebase injects as env vars at deploy time →
  Code reads process.env.FIREBASE_WEB_API_KEY

Local dev:
  .env.local (gitignored) — developer sets manually
  .env.example — lists all required vars, no values
```

## Rate Limiting — /api/clicks (from Sprint 2)

The click tracking endpoint is public (called from storefront, no auth).

```
Strategy: Firebase App Check
  - Attests that requests come from legitimate app instances
  - Zero extra infrastructure (Firebase native)
  - Blocks bots and Postman abuse automatically

Implementation:
  // storefront — initialize App Check
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(SITE_KEY) })

  // /api/clicks route — verify App Check token
  await appCheck.verifyToken(req.headers['x-firebase-appcheck'])
```

## File Upload Validation (Sprint 2)

Every image upload must be validated server-side before storage.

```
Rules (enforce in order):
  1. File type   — MIME type must be image/jpeg | image/png | image/webp
                   Validate magic bytes server-side, not just Content-Type header
  2. File size   — max 5MB per image
  3. Dimensions  — enforced post-upload by Cloud Run image_processor worker
  4. Path        — only businesses/{businessId}/items/* allowed per owner

Cloud Run worker trigger on upload:
  - Resize to 800×800 max (preserve aspect ratio)
  - Convert to WebP for efficiency
  - Delete original after resize
  - Update imageUrl in Firestore items/{id}
```

## Content Security Policy

```typescript
// next.config.ts — security headers
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "img-src 'self' https://storage.googleapis.com https://firebasestorage.googleapis.com",
      "script-src 'self' https://www.googletagmanager.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
]
```

## Firestore Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.token.role == 'admin';
    }
    function isOwner(businessId) {
      return request.auth != null &&
             get(/databases/$(database)/documents/businesses/$(businessId)).data.ownerId
             == request.auth.uid;
    }
    function isValidClick() {
      return request.resource.data.keys().hasOnly(['businessId','itemId','createdAt','ua'])
          && request.resource.data.businessId is string
          && request.resource.data.createdAt == request.time;
    }

    match /businesses/{businessId} {
      allow read: if isAdmin() || isOwner(businessId);
      allow create, update, delete: if isAdmin();

      match /items/{itemId} {
        allow read: if resource.data.active == true || isAdmin() || isOwner(businessId);
        allow write: if isAdmin() || isOwner(businessId);
      }
    }

    match /clicks/{clickId} {
      allow create: if isValidClick();         // validates schema, blocks arbitrary writes
      allow read: if isAdmin() || isOwner(resource.data.businessId);
      allow update, delete: if false;          // append-only
    }

    match /users/{userId} {
      allow read: if isAdmin() || request.auth.uid == userId;
      allow write: if isAdmin();               // users cannot self-modify
    }
  }
}
```

## Firestore Rules Test Coverage

All 8 cases must pass before merge:

```
✅ owner can read own business
✅ owner cannot read another owner's business
✅ unauthenticated cannot read businesses
✅ anyone can create a click with valid schema
✅ click with extra fields is rejected
✅ click cannot be updated or deleted
✅ owner cannot write to users collection
✅ admin can read all businesses
```

Test command: `firebase emulators:exec --only firestore "pnpm test:rules"`

## WhatsApp Number Policy

```
Owners input their own WhatsApp number. Platform cannot verify ownership.

Mitigation:
  - Format validation: E.164 format only (+521XXXXXXXXXX)
  - Display in dashboard: "Verify this is YOUR number before publishing"
  - Abuse report: end customer can flag "wrong number" via report button
  - Admin can suspend business on confirmed abuse
  - No automated verification at MVP (Sprint 5+ can add WA Business API verify)
```

## Input Sanitization

All user-supplied text written to Firestore must be sanitized server-side.

```typescript
// shared/lib/sanitize.ts
import { escape } from 'html-escaper'  // zero-dependency, fast

export function sanitizeText(input: string): string {
  return escape(input.trim()).slice(0, 500)  // escape HTML + length cap
}

// Apply before every Firestore write of user content:
//   business.name, business.description
//   item.name, item.description
//   whatsappMessage (user-defined)
```
