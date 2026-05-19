# Runbook: Production Rollback

## When to use
- Error rate > 5% after a deploy
- p99 latency > 5s sustained for 2+ minutes
- Critical bug reported by multiple users

## Rollback steps

### 1. Identify the previous stable revision

```bash
gcloud run revisions list \
  --service sass-factory-storefront \
  --region us-central1 \
  --sort-by ~createTime \
  --limit 5
```

### 2. Route 100% traffic to previous revision

```bash
PREV_REVISION=sass-factory-storefront-00042-xyz  # from step 1

gcloud run services update-traffic sass-factory-storefront \
  --region us-central1 \
  --to-revisions "${PREV_REVISION}=100"
```

### 3. Verify rollback

```bash
curl -f https://storefront-prod-url/api/health
# Check Cloud Monitoring error rate dashboard
```

### 4. Alert team
Notify in #incidents: "Rolled back storefront to {PREV_REVISION}. Root cause investigation in progress."

### 5. Create hotfix branch

```bash
git checkout production
git checkout -b hotfix/{ticket}-description
# Fix → commit → push → fast-track deploy
```

## Estimated time to rollback: < 3 minutes
