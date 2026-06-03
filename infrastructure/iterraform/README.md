# Terraform Topology

Terraform mirrors `apps/` by deployable name:

| Code | Infrastructure |
| --- | --- |
| `apps/catalog-api` | `infrastructure/iterraform/catalog-api` |
| `apps/identity-api` | `infrastructure/iterraform/identity-api` |
| `apps/demos-api` | `infrastructure/iterraform/demos-api` |
| `apps/prospects-api` | `infrastructure/iterraform/prospects-api` |
| `apps/notifications-webhook` | `infrastructure/iterraform/notifications-webhook` |
| `apps/admin-fe` | `infrastructure/iterraform/admin-fe` |
| `apps/storefront-fe` | `infrastructure/iterraform/storefront-fe` |
| `apps/landing-fe` | `infrastructure/iterraform/landing-fe` |

Cross-cutting resources live under `infrastructure/iterraform/_shared`, including
Firestore, storage, Artifact Registry, shared IAM, and Pub/Sub topics.
Reusable Terraform modules live under `infrastructure/iterraform/modules`.

Each deployable keeps the same two-layer convention:

- `setup/` for privileged bootstrap resources.
- `app/` for CI-applied runtime resources.

Run `pnpm check:nomenclature` to verify both suffix rules and the `apps/*` ↔
`infrastructure/terraform/*` mirror.
