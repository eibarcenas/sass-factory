# SASS Factory

A **multi-tenant SaaS platform** for creating and managing themed web experiences — Valentine's Day, Three Kings Day, Mother's Day, Father's Day, Christmas, and any custom occasion.

Built with **Nuxt 4 · UnoCSS · Firestore · GCP · pnpm workspaces**.

---

## Architecture

```
sass-factory/
├── apps/
│   ├── admin/          # Nuxt 4 admin panel (this repo's main app)
│   └── template/       # Base Nuxt 4 themed app — cloned per topic
├── packages/
│   ├── core/           # @sass-factory/core — types, presets, constants
│   └── ui/             # @sass-factory/ui — shared Vue 3 components
├── infrastructure/
│   ├── firestore/      # Security rules, indexes, seed scripts
│   └── scripts/        # CLI: new-app.mjs scaffolder
└── .github/
    └── workflows/      # CI/CD: typecheck, deploy to Firebase + Cloud Run
```

### How it works

1. **Register an app** in the admin panel — pick a topic, customize the theme, select features
2. **Provision infrastructure** — the admin triggers async GCP + Firebase provisioning, watching real-time SSE progress
3. **App goes live** — the `template` app reads its `AppConfig` from Firestore and renders the themed experience
4. **Scale** — add more topics, clone the template, change only the config

---

## Stack

| Layer | Technology |
|---|---|
| Admin & Template | Nuxt 4 + Vue 3 (Composition API) |
| Styling | UnoCSS (utility-first, same as npmx.dev) |
| Database | Firebase Firestore |
| Hosting | Firebase Hosting (admin) + Cloud Run (template) |
| Realtime | Server-Sent Events (SSE) via H3 |
| Monorepo | pnpm workspaces |
| Language | TypeScript end-to-end |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Firebase project + GCP project

### Install

```bash
pnpm install
```

### Configure Firebase

```bash
cp apps/admin/.env.example apps/admin/.env
cp apps/template/.env.example apps/template/.env
# Fill in your Firebase credentials in each .env
```

### Development

```bash
# Admin panel (http://localhost:3000)
pnpm dev:admin

# Template app (http://localhost:3001)
pnpm dev:template
```

---

## Admin Panel

### Pages

| Route | Description |
|---|---|
| `/` | Dashboard — app grid, stats, search/filter |
| `/apps/new` | 4-step wizard: topic → theme → features → metadata |
| `/apps/[id]` | Edit app config |
| `/apps/[id]/analytics` | Per-app stats |
| `/infra` | Infrastructure environments list |
| `/infra/new` | Register + provision new GCP infrastructure |
| `/settings` | Admin settings |

### Register Infrastructure (SSE Flow)

When you provision infrastructure for an app, the admin opens an SSE connection and streams real-time progress:

```
POST /api/infra/register      → returns { jobId }
GET  /api/infra/:jobId/stream → SSE stream of ProvisionJob updates
GET  /api/infra/:jobId/status → polling fallback
```

Provisioning steps:
1. `init` — Validate GCP credentials
2. `firestore_config` — Write AppConfig to Firestore
3. `firebase_hosting` — Create Firebase Hosting site
4. `cloud_run` — Deploy template to Cloud Run
5. `domain` — Configure custom domain (skipped if none)
6. `ssl` — Wait for SSL certificate
7. `complete` — Finalize and return URLs

---

## Topic Presets

| Key | Name | Emoji | Font |
|---|---|---|---|
| `love` | Valentine's Day | ❤️ | Playfair Display |
| `reyes` | Reyes Magos | ⭐ | Cinzel |
| `mom` | Mother's Day | 🌸 | Lora |
| `dad` | Father's Day | 👔 | Merriweather |
| `bday` | Birthday | 🎂 | Nunito |
| `xmas` | Christmas | 🎄 | Mountains of Christmas |

Add more in `packages/core/src/types/app.ts` → `TOPIC_PRESETS`.

---

## App Features

Each app can enable/disable any combination:

| Feature | Description |
|---|---|
| `hero` | Opening banner with title and message |
| `timeline` | Chronological story of moments |
| `gallery` | Photo grid |
| `letter` | Personal written message |
| `feed` | Social feed / messages |
| `moments` | User-contributed moments |
| `music` | Background music player |
| `countdown` | Countdown to a special date |
| `closing` | Final section and CTA |

---

## Scaffold a New App (CLI)

```bash
node infrastructure/scripts/new-app.mjs --topic=mom --name="Dia de las Madres" --slug=madres-2025
```

Options:
- `--topic` — `love`, `reyes`, `mom`, `dad`, `bday`, `xmas`, or any custom string
- `--name` — Display name
- `--slug` — URL slug (auto-generated from name if omitted)
- `--status` — `draft` | `active` | `archived` (default: `draft`)

---

## Firestore Schema

```
apps/{appId}
  id, name, slug, topic, status
  theme: { primary, secondary, accent, background, font, emoji, gradient[] }
  features: string[]
  metadata: { title, description, ogImage }
  domain, ownerId
  createdAt, updatedAt

apps/{appId}/moments/{momentId}
  userId, content, mediaUrl, createdAt
```

---

## Seed Firestore

```bash
# Add service account to infrastructure/firestore/service-account.json (don't commit)
npx ts-node infrastructure/firestore/seed.ts
```

Seed creates 4 apps: `love`, `reyes`, `mom`, `dad` with full preset configs.

---

## Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## CI/CD

GitHub Actions (requires `workflow` scope on PAT):

| Trigger | Job |
|---|---|
| PR to `main`/`develop` | Typecheck |
| Push to `main` | Deploy admin → Firebase Hosting |
| Push to `main` | Deploy template → Cloud Run |

Required GitHub secrets:
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT
GCP_SERVICE_ACCOUNT_KEY
GCP_PROJECT_ID
GCP_REGION
```

---

## Branches

| Branch | Purpose |
|---|---|
| `develop` | Active development base |
| `main` | Production — triggers deploys |

---

## Contributing

1. Branch from `develop`
2. PR back to `develop`
3. `develop` → `main` for releases
