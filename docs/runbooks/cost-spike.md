# Runbook: Cost Spike

## When to use
- Budget alert fires (> $40/month or > $5/day)
- Unexpected spike in Cloud Logging or Cloud Run metrics

## Investigation steps

### 1. Check current spend

```bash
gcloud billing budgets list --billing-account=BILLING_ACCOUNT_ID
```

### 2. Identify top cost drivers

Go to GCP Console → Billing → Reports → Group by: Service

Common culprits:
- Cloud Run: unexpected traffic spike or missing scale-to-zero
- Firestore: runaway reads (missing index causing full collection scans)
- Claude API: rate limit not working, user abusing AI generation
- Cloud Storage: large files uploaded without size limit

### 3. Check Cloud Run for runaway instances

```bash
gcloud run services list --region us-central1
# Look for min-instances > 0 unexpectedly
```

### 4. Check AI generation rate

```bash
gcloud logging read \
  'jsonPayload.message="click recorded" OR jsonPayload.message="Demo generated"' \
  --limit 100 \
  --format json | jq '.[].jsonPayload.userId' | sort | uniq -c | sort -rn
```

### 5. Emergency actions

- Reduce max-instances on Cloud Run:
  ```bash
  gcloud run services update sass-factory-admin \
    --max-instances 5 --region us-central1
  ```

- Temporarily disable AI generation (set rate limit to 0):
  Set `ANTHROPIC_API_KEY` to empty in Secret Manager

## Target: < $40/month for 500 businesses
