# EDA Nomenclature

Event-driven architecture names must describe the resource and the business fact
without embedding the product brand or GCP project name.

## Naming Rules

| Concept | Pattern | Example |
| --- | --- | --- |
| Event type | `<domain>.<aggregate>.<fact>.v<version>` | `prospects.prospect.created.v1` |
| Topic | `topic-<domain>-<aggregate>-<fact>-v<version>` | `topic-prospects-prospect-created-v1` |
| Subscription | `sub-<domain>-<aggregate>-<fact>-v<version>-to-<subscriber>` | `sub-prospects-prospect-created-v1-to-notifications-webhook` |
| Push route | `/internal/events/<domain>-<aggregate>-<fact>-v<version>` | `/internal/events/prospects-prospect-created-v1` |

## Current Event Catalog

| Event type | Topic | Publisher | Subscriber | Subscription |
| --- | --- | --- | --- | --- |
| `catalog.business.status-changed.v1` | `topic-catalog-business-status-changed-v1` | `catalog-api` | `notifications-webhook` | `sub-catalog-business-status-changed-v1-to-notifications-webhook` |
| `prospects.prospect.created.v1` | `topic-prospects-prospect-created-v1` | `prospects-api` | `notifications-webhook` | `sub-prospects-prospect-created-v1-to-notifications-webhook` |
| `demos.demo.accepted.v1` | `topic-demos-demo-accepted-v1` | `demos-api` | `notifications-webhook` | `sub-demos-demo-accepted-v1-to-notifications-webhook` |

## Current Counts

- Domain events: 3
- Domain event topics: 3
- Domain subscribers: 1
- Domain subscriptions: 3
- Platform topics: 1 (`topic-platform-budget-alert-triggered-v1`)

## Rules of Thumb

- Use past-tense facts: `created`, `accepted`, `status-changed`.
- Version event contracts from day one with `v1`.
- Keep topic names and event types aligned, but do not make them identical.
- Name subscriptions from the event to the consumer.
- Do not use product, brand, or environment prefixes such as `catalog-mx`, `dev`, or `prod`.
