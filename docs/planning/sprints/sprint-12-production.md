# Sprint 12 — Production + Custom Domains + GDPR

| Field | Value |
|---|---|
| Branch | `sprint/12-production` from `develop` |
| Status | ⏳ Pending |
| Stack | GCP Cloud Run, Cloud Load Balancer, Certificate Manager, Terraform |
| Initiatives | Platform Core (US-031) |
| Pre-condition | Sprint 11 merged to `develop` |

---

## Objective

Ship to production. First deploy to `ei-catalog-stg` and `ei-catalog-prod`. Configure custom domains (`dev.catalog.mx`, `stg.catalog.mx`, `catalog.mx`) with automatic SSL. Add the GDPR account deletion endpoint and set up click data retention (90-day TTL). Configure GitHub environment protection for production deploys.

---

## Gitflow → Environment Mapping

| Branch | Environment | GCP Project | Domain |
|---|---|---|---|
| `develop` | dev | `ei-catalog-dev` | `dev.catalog.mx` |
| `release/*` | stg | `ei-catalog-stg` | `stg.catalog.mx` |
| `production` | prod | `ei-catalog-prod` | `catalog.mx` |

---

## First Deploy Checklist (stg + prod)

- [ ] Apply `infrastructure/iterraform/setup/` for `ei-catalog-stg` and `ei-catalog-prod`
- [ ] Create Firestore Native database in each project
- [ ] Configure WIF pool + deployer SA for each project
- [ ] Add GitHub secrets: `WIF_PROVIDER_STG`, `WIF_SA_STG`, `WIF_PROVIDER_PROD`, `WIF_SA_PROD`
- [ ] Push to `release/0.1.0` → triggers `deploy-stg.yml`
- [ ] Smoke test stg — all three `/health` endpoints return 200
- [ ] Push to `production` → triggers `deploy-prod.yml`
- [ ] Smoke test prod

---

## Custom Domains

DNS records point to Cloud Run service URLs. Cloud Run handles SSL automatically via Google-managed certificates.

```
dev.catalog.mx    → catalog-mx-storefront-dev-*.run.app
stg.catalog.mx    → catalog-mx-storefront-stg-*.run.app
catalog.mx        → catalog-mx-storefront-prod-*.run.app
```

Admin and API also get subdomains (`admin.catalog.mx`, `api.catalog.mx`).

---

## GitHub Environment Protection

`production` GitHub environment requires manual approval before `deploy-prod.yml` runs.

```yaml
# .github/workflows/deploy-prod.yml
jobs:
  deploy:
    environment: production   # ← requires approval in GitHub UI
```

---

## GDPR — Account Deletion

```
DELETE /api/v1/account
  → Auth: OWNER or SUPER_ADMIN
  → Deletes Business + all Items from Firestore
  → Deletes images from GCS (prefix: products/{businessId}/)
  → Deletes Firebase Auth user
  → Returns 204
```

Not a soft delete — data is permanently removed.

---

## Click Data Retention (90 days)

Firestore TTL policy on `clicks` collection:

```python
# Applied via Firestore Admin SDK during setup
client.collection("clicks").document().set({
    "expire_at": datetime.utcnow() + timedelta(days=90)
})
```

Firestore automatically deletes documents after `expire_at`.

---

## Security Headers (Storefront)

Added to Next.js `next.config.ts`:

```typescript
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
]
```

---

## Budget Alerts

Each GCP project has a $40/month budget alert configured via Terraform `budget` module:
- 50% threshold → email
- 90% threshold → email + pub/sub (future: auto-scale-down)
- 100% threshold → email

---

## Tests

### Smoke Tests (post-deploy, runs in CI)
- `GET https://catalog.mx/health` returns 200
- `GET https://api.catalog.mx/health` returns 200
- `GET https://admin.catalog.mx` returns 200 with correct `<title>`

### Integration
- `DELETE /api/v1/account` removes business, items, and GCS files
- `DELETE /api/v1/account` for non-existent business returns 404
- Click documents older than 90 days are marked with `expire_at`

### E2E (Playwright against stg)
```
production.spec.ts
  ✓ catalog.mx/demo/{slug} loads correctly
  ✓ WhatsApp button works on mobile viewport
  ✓ SSL cert is valid (no browser warning)
  ✓ Security headers are present in response
```

---

## Acceptance Criteria

- [ ] `deploy-stg.yml` deploys successfully on push to `release/*`
- [ ] `deploy-prod.yml` requires manual approval in GitHub UI
- [ ] `catalog.mx` loads the storefront with valid SSL
- [ ] `DELETE /api/v1/account` permanently removes all owner data
- [ ] Click documents have `expire_at` field set to now + 90 days
- [ ] All security headers present on storefront responses
- [ ] Budget alert configured at $40/mo for all three GCP projects
- [ ] `pnpm typecheck` passes with zero errors
