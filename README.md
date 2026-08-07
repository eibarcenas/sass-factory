# catalog-platform — archived

Superseded by **[catalog-mx](https://github.com/eibarcenas/catalog-mx)**: one
Next.js app on Firebase Hosting + Cloud Run, replacing the 7 Cloud Run services
and 3 GCP projects that lived here.

## What happened to the code

The 4 FastAPI services (`identity-api`, `stores-api`, `prospects-api`,
`notifications-webhook`) and the 3 frontends (`admin-fe`, `store-fe`,
`landing-fe`) were removed, along with the 10 deploy workflows. **Git history is
preserved** — everything is recoverable from this repository's log.

The GCP projects those services deployed to, `ei-catalog-dev` and
`ei-catalog-stg`, no longer exist. Their Firestore data and Storage buckets were
deliberately not recovered.

## Where things live now

| | |
|---|---|
| Application | https://github.com/eibarcenas/catalog-mx |
| Live site | https://ei-catalog-prod.web.app |
| Migration rationale and decisions | `docs/architecture/migration-spec.md` in catalog-mx |

## One thing worth knowing before reusing anything here

`factory_auth` (in the separate `eibarcenas/factory-sdk` repo), which the
FastAPI services depended on for RBAC, treats a user with **no role claim as an
OWNER**:

```python
role = claims.role or Role.OWNER   # factory_auth/middleware.py
```

Anyone able to sign in passed `require_owner`. It also honours `DEV_USER_EMAIL`
and an `INTERNAL_SERVICE_SECRET` header, each granting `SUPER_ADMIN`. catalog-mx
deliberately does not carry any of that forward. Do not copy it into a new
project.
