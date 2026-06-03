# Nomenclature

Names should describe the deployable unit without needing extra context. Use
kebab-case and a suffix that states the runtime shape.

## Deployable Suffixes

| Unit type | Required suffix | Example |
| --- | --- | --- |
| Microservice / backend API | `-api` | `catalog-api`, `billing-api` |
| Frontend app | `-fe` | `admin-fe`, `storefront-fe` |
| Microfrontend | `-mfe` | `checkout-mfe`, `catalog-editor-mfe` |
| Webhook receiver | `-webhook` | `mercadopago-webhook`, `stripe-webhook` |

## Naming Rules

- Use `<bounded-context>-<unit-type>` for deployables: `catalog-api`, `owner-fe`, `billing-webhook`.
- Put backend microservices under `apps/<name>-api`.
- Use kebab-case only: lowercase letters, numbers, and single hyphens.
- Avoid generic names such as `api`, `backend`, `frontend`, `service`, `app`, `web`, or `server`.
- Avoid overloaded names such as `admin` unless the suffix clarifies the unit: `admin-fe`.
- Name by business capability or integration source, not by framework: `catalog-api`, not `fastapi-api`; `storefront-fe`, not `next-fe`.
- Keep code and infrastructure names aligned. If a deployable is `catalog-api`, its mirrored infrastructure unit should also be `catalog-api`.
- Pub/Sub resources use resource prefixes, not product prefixes: `topic-...` for topics and `sub-...` for subscriptions.

## Current API Services

| Folder | Responsibility |
| --- | --- |
| `apps/catalog-api` | Catalog and item lifecycle |
| `apps/identity-api` | Firebase claims and owner identity |
| `apps/demos-api` | Demo creation and acceptance |
| `apps/prospects-api` | Public lead capture |
| `apps/notifications-webhook` | Pub/Sub push notifications receiver |

## Current Frontend Apps

| Folder | Deployable name |
| --- | --- |
| `apps/admin-fe` | `admin-fe` |
| `apps/storefront-fe` | `storefront-fe` |
| `apps/landing-fe` | `landing-fe` |

When app folders are renamed, update all Dockerfiles, workflows, Terraform inputs,
package names, lockfile importers, and workspace references in the same change.
