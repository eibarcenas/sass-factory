# Monitoring, Reliability & Cost

## Health Check Endpoints

Both apps expose `/healthz` for Firebase App Hosting liveness checks.

```typescript
// app/healthz/route.ts (same pattern in both apps)
export async function GET() {
  return Response.json({ status: 'ok', ts: Date.now() })
}
```

```yaml
# apphosting.yaml
runConfig:
  minInstances: 0
  healthCheck:
    path: /healthz
    initialDelaySeconds: 10
    periodSeconds: 30
```

FastAPI also exposes `/healthz`:
```python
@app.get("/healthz")
async def health() -> dict:
    return {"status": "ok"}
```

## Structured Logging

Every server-side log must include context fields. Never log plain strings in production.

```typescript
// shared/lib/logger.ts
export const log = {
  info: (msg: string, ctx: Record<string, unknown> = {}) =>
    console.log(JSON.stringify({ severity: 'INFO', message: msg, ...ctx })),
  error: (msg: string, ctx: Record<string, unknown> = {}) =>
    console.error(JSON.stringify({ severity: 'ERROR', message: msg, ...ctx })),
}

// Always include businessId and requestId:
log.info('click tracked', { businessId, itemId, requestId: req.headers['x-request-id'] })
log.error('firestore write failed', { businessId, error: e.message, stack: e.stack })
```

```python
# Python structured logging (apps/api, apps/workers)
import logging, json

logger = logging.getLogger(__name__)

# Usage:
logger.info("click tracked", extra={"businessId": business_id, "itemId": item_id})
logger.error("firestore write failed", extra={"businessId": business_id, "error": str(e)})
```

Cloud Logging parses `severity` and `message` fields. Logs become queryable:
```
resource.type="cloud_run_revision"
jsonPayload.businessId="gorras-bebe-kids"
severity="ERROR"
```

## SLOs (Service Level Objectives)

```
Service         Metric              Target    Measurement
────────────────────────────────────────────────────────
Storefront      p95 TTFB            < 800ms   Cloud Monitoring
Storefront      Availability        99.5%     Uptime check
Dashboard       p95 TTFB            < 1200ms  Cloud Monitoring
/v1/clicks      p99 latency         < 500ms   Cloud Monitoring
Firestore       Read latency        < 50ms    Firebase console
```

Alert threshold: page on-call when error rate > 1% over 5 minutes.

## Rollback Strategy

```
Firebase App Hosting keeps last 3 deployments.

Rollback procedure:
  1. Firebase Console → App Hosting → Deployments
  2. Select last known good deployment → "Roll back"
  3. Takes ~2 minutes to propagate globally

Zero-downtime deploys: Firebase App Hosting handles traffic shifting automatically.
No manual Blue/Green needed.
```

## Cold Start Mitigation

```
MVP strategy:
  storefront: minInstances: 0 (acceptable — first hit in a while may be slow)
  dashboard:  minInstances: 1 (admin experience must be snappy, ~$15/month)

Next.js ISR cache reduces cold start impact on storefront:
  fetch(url, { next: { revalidate: 300 } })  // 5-min ISR cache
```

## Caching Strategy

```
Page                  Cache strategy          TTL
────────────────────────────────────────────────────────
/[slug]               ISR (revalidate)        5 minutes
/[slug] — images      Cloud CDN               1 year (immutable after resize)
/api/clicks           no-store                —
/healthz              no-store                —
/v1/* (FastAPI)       no-store                — (data always fresh)

On-demand invalidation:
  FastAPI calls revalidatePath('/{slug}') after:
  - business update (save appearance, products)
  - business publish
  - business suspend (ISR invalidated → shows 404)
```

## Image CDN

```typescript
// next.config.ts
images: {
  remotePatterns: [{
    protocol: 'https',
    hostname: 'storage.googleapis.com',
    pathname: '/YOUR_BUCKET/**',
  }]
}
// next/image serves from /_next/image with:
// Cache-Control: public, max-age=31536000, immutable
// Automatic WebP/AVIF per browser support
```

## Cost Model (100 businesses, 200 visits/day each)

```
Firestore reads:
  100 × 200 × 5 = 100,000 reads/day
  With ISR cache (80% hit rate): 20,000 reads/day → stays in free tier
  Without ISR: $0.90/month

Firestore writes (clicks):
  100 × 50 clicks/day = 5,000/day → free tier (limit: 20,000/day)

Cloud Storage images:
  100 × 10 items × 200KB = 200MB stored → $0.005/month
  Egress without CDN: ~$48/month ⚠️
  With next/image CDN: 90%+ reduction → ~$5/month

Estimated total with ISR + next/image CDN:
  Firestore:          $0/month  (free tier)
  Cloud Storage:       $5/month  (CDN, not raw egress)
  Firebase App Hosting: $0–10/month (usage-based)
  Cloud Run (api):     $0–5/month  (scale to zero)
  ──────────────────────────────────────
  Total:              ~$5–15/month operational
  Revenue at 100 clients (all Starter): $900/month
  Margin: 98%+ ✅
```

## Budget Alerts (Terraform)

Configured via `modules/gcp/budget` — see [infrastructure/terraform.md](terraform.md).

```
Alert 1 — Warning:  50% of $20/month ($10) → email to ops team
Alert 2 — Critical: 100% of $20/month ($20) → email + disable non-critical services
Alert 3 — GCP cost anomaly detection → auto-alert on unusual spikes
```

## GDPR / PII & Data Retention

```
Data collected        Classification   Retention policy
─────────────────────────────────────────────────────────
users/{uid}.phone     PII              Delete on account deletion
businesses/* (all)    Business data    Delete on business deletion (cascade)
clicks/{id}           Behavioral       90-day hard delete after soft-delete
clicks_daily/{id}     Aggregated       Indefinite (no PII, just counts)
invoices/{id}         Financial        7 years (legal obligation MX)
audit_log/{id}        Audit trail      2 years

Right to erasure (owner requests deletion):
  1. Admin deletes business → Eventarc cascade_delete worker
  2. users/{uid} document deleted
  3. Firebase Auth account deleted (Admin SDK)
  4. clicks soft-deleted → hard-deleted after 90 days
  5. invoices retained 7 years but phone anonymized to "***"

End customer data:
  No account created. clicks/{id} stores: businessId, itemId, createdAt, user-agent
  IP address NOT stored. Customer phone NOT stored.
```

Privacy policy page required before public launch (Sprint 7).

## Deployment Checklist (Definition of Done per Sprint)

```
Before merging to main:
  [ ] pnpm typecheck passes
  [ ] pytest unit passes — coverage ≥ 80%
  [ ] pnpm build passes (both apps)
  [ ] Firestore rules tests pass (pnpm test:rules)
  [ ] /healthz returns 200 in preview channel
  [ ] No new console.log (only structured logger)
  [ ] No secrets in code or git history
  [ ] New env vars documented in .env.example
```
