---
name: cost-check
description: Estimates GCP cost impact of a proposed feature or change
---

Estimate the GCP cost impact of: $ARGUMENTS

Current baseline: ~$31/month for 500 businesses (as per docs/planning/master-plan.md)
Budget alert threshold: $40/month

Steps:
1. Identify which GCP services are involved (Cloud Run, Firestore, Cloud Storage, etc.)
2. Estimate the monthly delta for each service:
   - Cloud Run: estimate compute time, memory, requests/month
   - Firestore: estimate reads/writes/deletes per day × 30
   - Cloud Storage: estimate GB stored + egress
   - External APIs: estimate calls/month × price/call
3. Sum the delta
4. New total = $31 + delta
5. If new total > $40: flag as OVER BUDGET and suggest cheaper alternative
6. Report the breakdown in a table

Output format:
## Cost Analysis: {what's being added}

| Service | Current | Delta | New |
|---------|---------|-------|-----|

**New monthly total: $X**
**Status: ✅ Under budget / ⚠️ Over budget**

[If over budget: suggest alternative approach]
