# SASS Factory

A monorepo for creating and managing themed web experiences (Valentine's Day, Mother's Day, Father's Day, Three Kings Day, Christmas, and more).

## Stack

- **Nuxt 4** — Admin panel and app template
- **UnoCSS** — Utility-first styling
- **TypeScript** — End-to-end type safety
- **Firebase/Firestore** — Data storage and real-time sync
- **pnpm workspaces** — Monorepo management

## Structure

```
sass-factory/
├── apps/
│   ├── admin/              # Nuxt 4 admin panel
│   └── template/           # Base Nuxt 4 themed app template
├── packages/
│   ├── core/               # Shared types, composables, utils
│   └── ui/                 # Shared Vue 3 UI components
├── infrastructure/
│   ├── firestore/          # Rules, indexes, seed data
│   └── scripts/            # CLI scaffolding scripts
└── .github/
    └── workflows/          # CI/CD pipelines
```

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- Firebase project

### Install

```bash
pnpm install
```

### Configure Firebase

Copy `.env.example` to `.env` in each app directory and fill in your Firebase credentials:

```bash
cp apps/admin/.env.example apps/admin/.env
cp apps/template/.env.example apps/template/.env
```

### Development

```bash
# Run admin panel
pnpm dev:admin

# Run template app
pnpm dev:template
```

### Create a New Themed App

```bash
pnpm new:app --topic=mom --name="Dia de las Madres" --slug=madres-2024
```

Options:
- `--topic` — Topic key: `love`, `reyes`, `mom`, `dad`, `bday`, `xmas`, or any custom string
- `--name` — Display name for the app
- `--slug` — URL slug (auto-generated from name if omitted)
- `--status` — Initial status: `draft` | `active` | `archived` (default: `draft`)
- `--seed` — Print seed instructions after scaffolding

### Seed Firestore

```bash
# Add service account key to:
# infrastructure/firestore/service-account.json  (do NOT commit this)

npx ts-node infrastructure/firestore/seed.ts
```

### Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Topics / Presets

| Key | Name | Emoji | Font |
|-----|------|-------|------|
| `love` | Valentine's Day | ❤️ | Playfair Display |
| `reyes` | Reyes Magos | ⭐ | Cinzel |
| `mom` | Mother's Day | 🌸 | Lora |
| `dad` | Father's Day | 👔 | Merriweather |
| `bday` | Birthday | 🎂 | Nunito |
| `xmas` | Christmas | 🎄 | Mountains of Christmas |

## Features

Each app can enable/disable any combination of:

- `hero` — Opening banner section
- `timeline` — Chronological story
- `gallery` — Photo grid
- `letter` — Personal written letter
- `feed` — Social feed / messages
- `moments` — User-contributed moments
- `music` — Background music player
- `countdown` — Countdown timer
- `closing` — Closing section

## CI/CD

GitHub Actions workflows handle:
- Quality checks (typecheck) on all PRs
- Admin panel builds and deploys to **Firebase Hosting** on `main`
- Template app builds and deploys to **Google Cloud Run** on `main`

Required GitHub secrets:
- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, etc.
- `FIREBASE_SERVICE_ACCOUNT` — Firebase Hosting service account JSON
- `GCP_SERVICE_ACCOUNT_KEY` — Cloud Run service account JSON
- `GCP_PROJECT_ID`, `GCP_REGION`
