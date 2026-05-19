# Runbook: Incident Response

## Severity levels

| Level | Criteria | Response time |
|-------|----------|--------------|
| P0 | Storefront down (0% availability) | Immediate |
| P1 | Error rate > 10%, data loss risk | < 15 min |
| P2 | Error rate > 1%, degraded performance | < 1 hour |
| P3 | Single feature broken, workaround exists | Next business day |

## P0/P1 Response

### 1. Acknowledge (< 2 min)
Post in #incidents: "Investigating {service} issue. ETA for update: 15 min"

### 2. Assess
```bash
# Check service health
curl https://storefront-url/api/health

# Check recent deploys
gcloud run revisions list --service sass-factory-storefront \
  --region us-central1 --limit 3

# Check error logs
gcloud logging read \
  'severity>=ERROR AND resource.type="cloud_run_revision"' \
  --limit 50 --format json | jq '.[].jsonPayload'
```

### 3. Mitigate
- If caused by deploy → Rollback (see rollback.md)
- If Firestore issue → Check rules and indexes
- If external API (Claude/MP) → Check status pages

### 4. Resolve + Post-mortem
After resolution:
- Document in #incidents: what happened, impact, fix
- Create post-mortem issue in GitHub within 24 hours
- Update this runbook if a new failure mode was discovered

## RTO (Recovery Time Objective): < 30 minutes
## RPO (Recovery Point Objective): < 5 minutes (Firestore PITR)
