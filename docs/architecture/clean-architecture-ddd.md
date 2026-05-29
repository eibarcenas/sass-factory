# Clean Architecture & Domain-Driven Design

How this project applies these patterns, when they make sense, and when they don't.

---

## What they are (and what they aren't)

**Clean Architecture** is an architectural pattern. It tells you how to organize layers and which direction dependencies are allowed to flow. Robert Martin formalized it in 2012, building on Hexagonal Architecture (Alistair Cockburn, 2005) and Onion Architecture (Jeffrey Palermo, 2008) — all three are variations of the same central idea.

**Domain-Driven Design (DDD)** is a design methodology, not a folder structure. Eric Evans formalized it in his 2003 book. It tells you how to think about the problem, not where to put the files.

They answer different questions:
- DDD: *what* to model and how to name it
- Clean Architecture: *where* to put it and how layers relate

You can use one without the other. They complement each other well when the domain is genuinely complex.

---

## The one rule of Clean Architecture

Dependencies only point inward. The domain knows nothing about the outside world.

```
┌─────────────────────────────────────────┐
│  Frameworks & Drivers                   │
│  (HTTP, Firebase SDK, Firestore client) │
│  ┌───────────────────────────────────┐  │
│  │  Interface Adapters               │  │
│  │  (routers, repositories impls)    │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Use Cases / Services       │  │  │
│  │  │  (business_service.py)      │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  Domain / Entities    │  │  │  │
│  │  │  │  (Business, Item)     │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

If any import crosses that boundary outward (domain importing from a router, a service importing from FastAPI), that's a layer violation.

---

## Core DDD concepts

### Ubiquitous Language

Every term in the codebase matches the language the business uses. Developers and stakeholders refer to the same concepts with the same words — no translation layer.

In this project: `BusinessStatus.SENT`, `activate`, `suspend`, `OWNER`, `SUPER_ADMIN` are business terms, not technical ones. A business owner would recognize them.

### Entity

An object with a unique identity that persists across time. Its identity matters more than its current attribute values.

```typescript
// Business is an Entity — identity is the slug/id, not its attributes
interface Business {
  id: string       // ← identity
  slug: string     // ← identity
  name: string     // attributes can change, identity cannot
  status: BusinessStatus
}
```

### Value Object

An object with no identity. Defined entirely by its values. Two value objects with the same values are interchangeable. Treat them as immutable.

```typescript
// BusinessTheme is a Value Object — no id, defined by its fields
interface BusinessTheme {
  primary: string
  secondary: string
  accent: string
  background: string
  font: string
}
```

### Aggregate

A cluster of entities and value objects treated as a single unit. The Aggregate Root is the only entry point — nothing outside should bypass it to modify its children.

In this project: `Business` is the Aggregate Root. `Item` lives as a sub-collection under it. No code should write directly to an item without going through the business context.

```python
# Correct: go through the business
item_service.add_item(business_id, item)

# Wrong (in Clean Architecture terms): bypass the aggregate
db.collection("items").document().set(item)
```

### Repository

An abstraction over persistence. The domain defines the interface; the infrastructure implements it. The domain never knows if it's talking to Firestore, Postgres, or an in-memory dict.

```python
# Domain defines the contract (what)
class BusinessRepository(Protocol):
    def get(self, id: str) -> Business: ...
    def save(self, business: Business) -> None: ...
    def list(self, status: str | None) -> list[Business]: ...

# Infrastructure implements it (how)
class FirestoreBusinessRepository:
    def get(self, id: str) -> Business:
        doc = get_db().collection("businesses").document(id).get()
        ...
```

### Bounded Context

A boundary inside which a model is consistent and has a specific meaning. The same word can mean different things in different bounded contexts.

In this project:
- `admin` context: sees all businesses, manages lifecycle, full Business model
- `storefront` context: sees only active businesses, only public fields
- `api` context: enforces RBAC, owns the source of truth

---

## How this project maps to the patterns

### Current structure

| Layer | Where it lives | Notes |
|---|---|---|
| Domain | `packages/core/src/types/` | Shared types, enums — good |
| Services | `apps/api/app/services/` | `item_service.py` exists — good |
| Routers | `apps/api/app/routers/` | Mix of HTTP + domain logic — needs cleanup |
| Infrastructure | `apps/api/app/db.py` | Firestore client — good |

### What's misplaced today

`VALID_TRANSITIONS` and `ACTION_TO_STATUS` in [routers/businesses.py](../../../apps/api/app/routers/businesses.py) are domain logic living in the HTTP layer. If a cron job or a webhook also needs to transition business states, this logic has to be duplicated or imported from a router — both are wrong.

### Target structure (backend)

```
apps/api/app/
│
├── domain/
│   ├── business.py        # Business entity, VALID_TRANSITIONS, transition rules
│   └── item.py            # Item entity, validation rules
│
├── repositories/          # Interfaces (Python Protocol)
│   ├── business_repo.py   # get / save / list / delete
│   └── item_repo.py
│
├── services/              # Use cases — orchestrate domain + repos
│   ├── business_service.py  # transition_status(), create_demo()
│   └── item_service.py      # already exists, already correct
│
├── infrastructure/
│   └── firestore/
│       ├── business_repo.py  # implements BusinessRepository
│       └── item_repo.py      # implements ItemRepository
│
├── routers/               # HTTP only — no business logic
│   └── businesses.py      # receive request → call service → return JSON
│
└── dependencies.py        # FastAPI Depends() — wire repos into services
```

### Target structure (frontend)

```
apps/admin/src/
│
├── domain/                # re-exports from @eguru/core (already correct)
│
├── infrastructure/        # pure HTTP functions, no hooks, no state
│   └── api/
│       ├── businessApi.ts # fetchBusinesses(), postBusinessAction()
│       └── itemApi.ts
│
├── application/           # hooks = use cases, call infrastructure
│   ├── useBusinesses.ts   # already exists, already correct shape
│   └── useBusinessAction.ts
│
└── ui/                    # React components, no direct API calls
    ├── pages/
    └── components/
```

The current `useBusinesses.ts` has hardcoded API paths inside the hook. Moving those paths into `businessApi.ts` makes the hook testable without mocking fetch.

---

## Why Clean Architecture and DDD for this project

This project has genuine domain complexity that justifies the overhead:

- **State machine**: `draft → demo → sent → accepted → active → suspended` is a real business workflow, not a CRUD field
- **RBAC**: OWNER and SUPER_ADMIN have different views of the same data and different allowed actions
- **Multi-tenant**: each Business is an isolated tenant — the aggregate boundary matters
- **Multiple contexts**: admin panel, public storefront, and API each model `Business` differently

Without these patterns, the state machine logic would scatter across routers, the RBAC rules would be duplicated, and adding a new workflow step would require touching many files.

---

## When to use these patterns

### Use Clean Architecture when

- The system has business rules that need to be tested without a database or HTTP server
- You anticipate changing the database, framework, or cloud provider
- The team is growing and you need clear ownership per layer
- The system needs to last years, not months

### Use DDD when

- The domain has real complexity: approval flows, state machines, multi-role rules
- Developers need to talk frequently with business stakeholders
- There are distinct subdomains with different rules that shouldn't bleed into each other

### Skip them when

- It's a simple CRUD app with no business rules (a blog, a contact form)
- It's a prototype that might be thrown away in 3 months
- The team is 1-2 people and the overhead isn't worth it
- The problem is technical, not domain-driven (a data migration script, a DevOps tool)

---

## Comparison with other patterns

| Pattern | Solves | When to use |
|---|---|---|
| **MVC** | Separate presentation from data | Simple web apps, traditional frameworks (Rails, Django) |
| **Clean / Hexagonal / Onion** | Isolate domain from everything external | Complex domains, long-lived systems |
| **Event-Driven** | Decouple services that shouldn't know about each other | Microservices, async flows, high concurrency |
| **CQRS** | Separate read and write models | Systems where reads and writes scale or model differently |
| **Microservices** | Deploy and scale parts independently | Large teams, subdomains that scale differently |
| **DDD** | Model complex domains faithfully | When the business is more complex than the technology |

There is no universally correct pattern. The right pattern is the one that solves your current problem without over-engineering the next five years.

For this project: MVC would be insufficient given the state machine and RBAC complexity. Microservices would be premature for the current team size. Clean Architecture + DDD is the right middle ground — enough structure for the real complexity, without fragmenting a system a small team has to maintain.

---

## Note on terminology

"Infrastructure" means different things depending on context:

| Context | "Infrastructure" means |
|---|---|
| Clean Architecture | Code that talks to the outside world: `db.py`, HTTP clients, Firebase SDK |
| DevOps / Cloud | Servers, networks, Cloud Run, Terraform, CI/CD pipelines |

Clean Architecture has no opinion on cloud infrastructure. The two uses of the word are unrelated.
