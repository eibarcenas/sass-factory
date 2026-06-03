# Backend Clean Architecture

Each FastAPI backend service keeps business rules away from transport and external
systems. Backend units are split by deployable capability instead of one generic
API.

## Services

| Service | Responsibility |
| --- | --- |
| `apps/catalog-api` | Businesses, items, storefront reads, and image uploads |
| `apps/identity-api` | Firebase owner claims and auto-provision |
| `apps/demos-api` | Demo creation, owner activation, and demo acceptance |
| `apps/prospects-api` | Public prospect intake and prospect reads |
| `apps/notifications-webhook` | Pub/Sub push receiver for notification side effects |

## Event Flow

- `catalog-api` publishes `catalog.business.status-changed.v1` after lifecycle transitions.
- `prospects-api` publishes `prospects.prospect.created.v1` after a lead is persisted.
- `demos-api` publishes `demos.demo.accepted.v1` after a demo is claimed.
- `notifications-webhook` receives push subscriptions at `/internal/events/<slug>` and handles email side effects.

## Layers

- `app/domain/` contains pure business rules and value concepts. It must not import FastAPI, Firestore, Firebase, Pub/Sub, or SMTP.
- `app/application/` contains use cases. Use cases orchestrate domain rules and raise `ApplicationError` subclasses for expected failures.
- `app/infrastructure/` contains external gateways such as persistence clients, storage, identity providers, Pub/Sub, and email.
- `app/routers/` is the HTTP presentation edge. Routers adapt request/response models and translate application errors to `HTTPException`.

## Compatibility

`app/services/` remains as a legacy import path for older code and tests. New code
should import from `app.application.use_cases` or `app.infrastructure` directly.
