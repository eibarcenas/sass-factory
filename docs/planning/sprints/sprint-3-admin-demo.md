# Sprint 3 — Admin Panel + Demo Generator

| Field | Value |
|---|---|
| Branch | `sprint/3-admin-demo` from `develop` |
| Status | ✅ Done |
| Stack | React 18, Vite, Zustand, TanStack Query, FastAPI |
| Initiatives | Sales Engine (US-008, US-009, US-010, US-011, US-013) |
| Pre-condition | Sprint 2 merged to `develop` |

---

## Objective

Build the internal admin SPA that Erick uses to generate demos, manage businesses through the sales lifecycle, and activate owners. Includes the FastAPI business lifecycle API with server-side status machine validation.

---

## Key Files

```
apps/admin-fe/src/
├── pages/
│   ├── LoginPage.tsx              — Firebase Auth login (email/password)
│   └── DashboardPage.tsx          — shell with sidebar + main content
├── components/demos/
│   ├── DemoList.tsx               — business cards with status filters
│   ├── CreateDemoForm.tsx         — AI generation form with SSE streaming
│   └── ProductEditor.tsx          — inline product CRUD per business
├── hooks/
│   ├── useBusinesses.ts           — TanStack Query: list + status action
│   └── useItems.ts                — TanStack Query: item CRUD
├── store/
│   └── auth.ts                    — Zustand: user, role, mockMode
└── types/catalog.ts               — Business, Item, BusinessStatus

apps/catalog-api/app/
├── routers/businesses.py          — CRUD + status transitions
├── routers/items.py               — product CRUD per business
└── shared/domain/status_machine.py — valid transitions, server-side
```

---

## Business Status Machine

```
draft → demo → sent → accepted → active → suspended
                                         → expired
                                         → archived
```

Transitions validated server-side in `status_machine.py`. Client cannot skip states.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/businesses` | List with optional `?status=` filter |
| POST | `/api/v1/businesses` | Create new business (status: draft) |
| GET | `/api/v1/businesses/{id}` | Get single business |
| POST | `/api/v1/businesses/{id}/action` | Transition status |
| GET | `/api/v1/businesses/{id}/items` | List products |
| POST | `/api/v1/businesses/{id}/items` | Add product |
| PATCH | `/api/v1/businesses/{id}/items/{item_id}` | Update product |
| DELETE | `/api/v1/businesses/{id}/items/{item_id}` | Delete product |

---

## SSE Demo Generation

`POST /api/v1/generate` streams progress tokens as Server-Sent Events:
```
data: {"type": "token", "content": "..."}
data: {"type": "done", "business": {...}}
```

Admin UI reads the stream with `EventSource` and shows real-time output.

---

## Tests

### Unit (Vitest)
- `validateTransition(from, to)` returns `true` for valid moves, `false` for invalid
- `validateTransition('active', 'draft')` returns `false` (no backwards)
- `useBusinessAction` optimistically updates status in query cache

### Integration (FastAPI + Firestore emulator)
- `POST /api/v1/businesses/{id}/action` with invalid transition returns 409
- `POST /api/v1/businesses/{id}/action` with `{ action: 'publish' }` moves draft→demo
- `GET /api/v1/businesses` filters correctly by status query param

### E2E (Playwright)
```
admin-demo.spec.ts
  ✓ admin can log in with valid credentials
  ✓ unauthenticated user is redirected to /login
  ✓ admin generates a demo and sees SSE tokens streaming
  ✓ generated demo appears in DemoList with status 'draft'
  ✓ "Publish demo" button moves business to 'demo' status
```

---

## Acceptance Criteria

- [ ] Login page authenticates with Firebase and redirects to dashboard
- [ ] DemoList shows all businesses with status filter pills
- [ ] CreateDemoForm streams tokens from `/api/v1/generate` via SSE
- [ ] Status action buttons call API and optimistically update the card
- [ ] Invalid status transitions return 409 from the API
- [ ] `pnpm typecheck` passes with zero errors
