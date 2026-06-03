# SASS Factory

> Multi-tenant SaaS platform for creating and managing themed web experiences.
> One codebase, infinite occasions — Valentine's Day, Mother's Day, Three Kings Day, Christmas, and more.

**Stack:** Nuxt 4 · UnoCSS · Firestore · GCP Cloud Build · Terraform · pnpm workspaces · Docker · Kubernetes (kind)

> **TL;DR** — `git clone` + `make up` → http://localhost:4200

---

## Architecture

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          SASS FACTORY — SYSTEM OVERVIEW                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

  BROWSER / DEVELOPER
  ┌─────────────────────────────────────────────────────┐
  │  Admin Panel  ·  http://localhost:3000               │
  │  ┌──────────┐  ┌──────────┐  ┌─────────────────┐   │
  │  │Dashboard │  │ /apps/   │  │ /infra/         │   │
  │  │(app grid)│  │ new  [id]│  │ new  deploy     │   │
  │  └────┬─────┘  └────┬─────┘  └────────┬────────┘   │
  └───────┼─────────────┼─────────────────┼────────────┘
          │             │                 │
          ▼             ▼                 ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │  Nuxt 4 Server  (Nitro / H3)                                              │
  │                                                                           │
  │  composables/              server/api/                                    │
  │  ├─ useApps.ts             ├─ infra/simulate.post.ts                      │
  │  ├─ useProvision.ts        ├─ infra/register.post.ts                      │
  │  ├─ useCloudBuildDeploy.ts ├─ infra/deploy.post.ts                        │
  │  └─ useDevPorts.ts         ├─ infra/[jobId]/stream.get.ts  (SSE)          │
  │                            ├─ infra/[buildId]/cloud-build-stream.get.ts   │
  │                            └─ dev/{launch,stop,sync,ports}                │
  └───────────────────────────────────┬───────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
  ┌───────────────┐         ┌──────────────────┐       ┌──────────────────────┐
  │  MODE A       │         │  MODE B          │       │  MODE C              │
  │  Mock / Dev   │         │  Local Docker    │       │  GCP Cloud Build     │
  │               │         │                  │       │                      │
  │  useState()   │         │  local-simulator │       │  cloud-build.ts      │
  │  TOPIC_       │         │  ┌────────────┐  │       │  ┌────────────────┐  │
  │  PRESETS seed │         │  │docker info │  │       │  │ Cloud Build API│  │
  │               │         │  │docker build│  │       │  │ REST trigger   │  │
  │  No Firebase  │         │  │docker run  │  │       │  └───────┬────────┘  │
  │  No GCP       │         │  │health check│  │       │          │           │
  │  needed       │         │  └─────┬──────┘  │       │  deploy-app.yaml    │
  └───────────────┘         │        │         │       │  ┌────────────────┐  │
                            │  .dev-configs/   │       │  │ tf-init        │  │
                            │  {slug}.json     │       │  │ tf-apply       │  │
                            └────────┬─────────┘       │  │ docker-build   │  │
                                     │                 │  │ docker-push    │  │
                                     ▼                 │  │ cloud-run-     │  │
                            ┌──────────────────┐       │  │   deploy       │  │
                            │ Template App     │       │  │ notify-complete│  │
                            │ localhost:301x   │       │  └───────┬────────┘  │
                            │                 │       │          │           │
                            │ /api/app-config │       │  new GCP project     │
                            │ reads .dev-     │       │  per themed app      │
                            │ configs/        │       └──────────┼───────────┘
                            └──────────────────┘                 │
                                                                  ▼
                                                       ┌──────────────────────┐
                                                       │  Cloud Run           │
                                                       │  sass-{slug}         │
                                                       │  {region}.run.app    │
                                                       │                      │
                                                       │  Template App        │
                                                       │  APP_SLUG env var    │
                                                       │  → loads from        │
                                                       │    Firestore         │
                                                       └──────────────────────┘

  SSE PROGRESS STREAM (all modes)
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  POST /api/infra/simulate  ──► job created in memory                     │
  │  POST /api/infra/deploy    ──► Cloud Build triggered                     │
  │                                                                          │
  │  GET  /api/infra/{jobId}/stream          ◄── EventSource (browser)       │
  │       polls job-store every 800ms            fires: update / done / error│
  │                                                                          │
  │  GET  /api/infra/{buildId}/cloud-build-stream  ◄── EventSource (browser) │
  │       polls Cloud Build API every 3s          fires: step / done / error │
  └──────────────────────────────────────────────────────────────────────────┘

  DATA LAYER
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                                                                          │
  │  Firestore                      In-memory (dev)                          │
  │  ┌────────────────────┐         ┌────────────────────┐                  │
  │  │ apps/{appId}       │         │ useState('mock:apps')                 │
  │  │  name, slug, topic │         │ seeded from         │                  │
  │  │  theme, features   │   or    │ TOPIC_PRESETS       │                  │
  │  │  metadata, domain  │         │ (no Firebase needed)│                  │
  │  │  deployment.*      │         └────────────────────┘                  │
  │  │                    │                                                  │
  │  │ apps/{id}/moments  │         File-based (local dev)                   │
  │  └────────────────────┘         ┌────────────────────┐                  │
  │                                 │ .dev-ports.json    │                  │
  │  activated when                 │ .dev-configs/      │                  │
  │  FIREBASE_API_KEY is set        │   {slug}.json      │                  │
  └────────────────────────────────────────────────────────────────────────┘

  MONOREPO
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                                                                          │
  │  packages/core  ──────────────────────────────────────────────────────  │
  │  (@sass-factory/core)   AppConfig · AppTheme · TOPIC_PRESETS             │
  │         │                         │                                      │
  │         ├──────────► apps/admin-fe   │  (consumes types + Firestore utils)  │
  │         └──────────► apps/template│  (consumes types + theme config)     │
  │                                                                          │
  │  packages/ui  ────────────────────────────────────────────────────────  │
  │  (@sass-factory/ui)     AppCard · ThemePicker · FeatureToggle            │
  │         └──────────► apps/admin-fe   (shared Vue components)                │
  │                                                                          │
  └──────────────────────────────────────────────────────────────────────────┘
```

## How It Works

```
Admin Panel (Nuxt 4)
  │
  ├─ Create App        → topic + theme + features → saved to Firestore
  │
  ├─ Simulate (Docker) → Docker build + run locally → http://localhost:301x
  │   (no GCP needed)      SSE streams real-time progress
  │
  ├─ Deploy to GCP     → Cloud Build pipeline
  │                         └─ Terraform: new GCP project
  │                         └─ Docker: build + push Artifact Registry
  │                         └─ Cloud Run: deploy with APP_SLUG env
  │                         └─ SSE: live step progress back to admin
  │
  └─ Preview           → per-app dev server on stable port (3010+)
```

---

## Project Structure

```
sass-factory/
├── apps/
│   ├── admin/                   # Nuxt 4 admin panel
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   │   ├── index.vue            # Dashboard
│   │   │   │   ├── apps/new.vue         # Create app (4-step wizard)
│   │   │   │   ├── apps/[id].vue        # Edit app
│   │   │   │   ├── infra/new.vue        # 🐳 Local simulate / ☁️ Provision
│   │   │   │   └── infra/deploy.vue     # 🚀 Deploy to GCP via Cloud Build
│   │   │   ├── composables/
│   │   │   │   ├── useApps.ts           # Firestore CRUD (mock-aware)
│   │   │   │   ├── useProvision.ts      # SSE client for simulate/provision
│   │   │   │   ├── useCloudBuildDeploy.ts # SSE client for Cloud Build
│   │   │   │   └── useDevPorts.ts       # Local dev port registry
│   │   │   └── layouts/default.vue      # Admin shell + sidebar
│   │   └── server/
│   │       ├── api/
│   │       │   ├── infra/
│   │       │   │   ├── simulate.post.ts         # Start Docker simulation
│   │       │   │   ├── register.post.ts         # Start fake provisioner
│   │       │   │   ├── deploy.post.ts           # Trigger Cloud Build
│   │       │   │   ├── deploy-complete.post.ts  # Cloud Build callback
│   │       │   │   ├── [jobId]/stream.get.ts    # SSE for jobs
│   │       │   │   └── [buildId]/cloud-build-stream.get.ts  # SSE for CB
│   │       │   └── dev/
│   │       │       ├── launch.post.ts   # Start template dev server
│   │       │       ├── sync.post.ts     # Update config without restart
│   │       │       ├── ports.get.ts     # List running dev servers
│   │       │       └── stop.post.ts     # Stop dev server
│   │       └── utils/
│   │           ├── job-store.ts         # In-memory job state + SSE data
│   │           ├── local-simulator.ts   # Docker build/run orchestration
│   │           ├── provisioning.ts      # Fake/stub provisioner (→ real GCP)
│   │           ├── cloud-build.ts       # Cloud Build REST API client
│   │           └── dev-registry.ts      # Port + config file registry
│   │
│   └── template/                # Nuxt 4 base themed app
│       ├── app/
│       │   ├── pages/index.vue          # Themed landing page
│       │   └── composables/
│       │       ├── useAppConfig.ts      # Load config (Firebase or file)
│       │       └── useTheme.ts          # Inject CSS vars from AppConfig
│       └── server/api/
│           └── app-config.get.ts        # Serve config from .dev-configs/
│
├── packages/
│   ├── core/                    # @sass-factory/core
│   │   └── src/
│   │       ├── types/app.ts     # AppConfig, AppTheme, TOPIC_PRESETS
│   │       └── utils/firestore.ts  # Collection constants
│   └── ui/                      # @sass-factory/ui
│       └── src/components/
│           ├── AppCard.vue
│           ├── ThemePicker.vue
│           └── FeatureToggle.vue
│
├── infrastructure/
│   ├── cloudbuild/
│   │   └── deploy-app.yaml      # Cloud Build pipeline (5 steps)
│   ├── terraform/
│   │   ├── main.tf               # Root module (GCS backend)
│   │   ├── variables.tf
│   │   ├── terraform.tfvars.example
│   │   └── modules/gcp-project/ # Creates project, APIs, Artifact Registry, Cloud Run
│   ├── firestore/
│   │   ├── rules.firestore       # Security rules
│   │   ├── indexes.json          # Composite indexes
│   │   └── seed.ts               # Seed 4 apps (love, reyes, mom, dad)
│   ├── gcp/
│   │   └── setup.sh              # One-time service account setup
│   └── scripts/
│       ├── new-app.mjs           # CLI: scaffold new themed app
│       ├── dev-app.mjs           # CLI: launch app on stable port
│       └── docker-stop-all.mjs  # CLI: stop all sass containers
│
├── .dev-ports.json               # gitignored — port assignments
├── .dev-configs/                 # gitignored — per-app runtime configs
├── firebase.json                 # Firebase Hosting + Emulator config
├── .firebaserc
└── pnpm-workspace.yaml
```

---

## Quick Start — Kubernetes (kind)

> Single command starts a local k8s cluster + admin. Template apps are deployed dynamically — no static service list needed.

### Prerequisites

| Tool | Install |
|------|---------|
| Docker Desktop | https://docs.docker.com/get-docker/ |
| kind | `brew install kind` or https://kind.sigs.k8s.io |
| kubectl | `brew install kubectl` or https://kubernetes.io/docs/tasks/tools/ |

### 1. Clone & start

```bash
git clone https://github.com/eibarcenas/sass-factory.git
cd sass-factory
make up
```

`make up` will:
1. Create the kind cluster `sass-factory` (if not already running)
2. Build the admin Docker image
3. Load it into the cluster
4. Apply RBAC + Deployment + Service manifests
5. Wait for the admin pod to be ready

Admin panel is live at **http://localhost:4200** with 6 seed apps (mock mode — no Firebase or GCP needed).

### Common commands

| Command | Description |
|---------|-------------|
| `make up` | Create cluster + build + deploy admin |
| `make down` | Delete all deployments + destroy cluster |
| `make status` | `kubectl get deployments,services` |
| `make logs` | Follow admin pod logs |
| `make shell` | Shell into admin pod |
| `make rebuild` | Rebuild admin image + rolling restart |
| `make clean` | Delete cluster + remove all images |

### 2. Deploy template apps (on demand)

Template apps are **not pre-deployed** — they are created dynamically when you simulate:

1. Open **http://localhost:4200/infra/new**
2. Select an app → click **Run in Docker** (or k8s mode auto-detected)
3. Admin builds the template image, loads it into kind, creates a k8s Deployment + NodePort Service
4. App is live at `http://localhost:3010` (or next available port 3011–3019)

Ports are pre-mapped in `infrastructure/k8s/kind-config.yaml` — 10 slots (3010–3019).

### 3. Optional: enable Firebase / AI / GCP

Create a k8s Secret from your env file:

```bash
cp apps/admin-fe/.env.example apps/admin-fe/.env
# fill in apps/admin-fe/.env

kubectl create secret generic admin-env --from-env-file=apps/admin-fe/.env
make rebuild   # restart admin to pick up new secret
```

| Feature | Env vars to set |
|---------|----------------|
| Real Firestore | `FIREBASE_*` (all 6 vars) |
| AI app generation (`/apps/generate`) | `ANTHROPIC_API_KEY` |
| GCP Cloud Build deploy | `GCP_PROJECT_ID`, `FACTORY_URL`, `TF_STATE_BUCKET`, `CLOUD_BUILD_REPO` |

Without a secret the admin runs in **mock mode** automatically.

---

## Quick Start — Local (Node.js)

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20 | Use nvm |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| Docker | Desktop | For local simulation |
| Firebase CLI | latest | `npm i -g firebase-tools` (optional) |
| gcloud CLI | latest | For GCP deployment only |

### 1. Install

```bash
git clone https://github.com/eibarcenas/sass-factory.git
cd sass-factory
pnpm install
```

### 2. Choose your mode

#### Mode A — Mock (zero config, works immediately)

No `.env` file needed. The admin loads with 6 seed apps from `TOPIC_PRESETS`.

```bash
pnpm dev:admin    # http://localhost:3000
```

#### Mode B — Firebase Emulator (realistic local Firestore)

```bash
npm install -g firebase-tools
firebase emulators:start --only firestore   # terminal 1 → http://localhost:4000

cp apps/admin-fe/.env.emulator apps/admin-fe/.env
pnpm dev:admin                              # terminal 2
```

#### Mode C — Real Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore in Native mode
3. Register a Web App and copy the config:

```bash
cp apps/admin-fe/.env.example apps/admin-fe/.env
# Fill in FIREBASE_* values
pnpm dev:admin
```

---

## Topic Presets

Built-in themes in `packages/core/src/types/app.ts`:

| Key | Name | Emoji | Font | Primary |
|-----|------|-------|------|---------|
| `love` | Valentine's Day | ❤️ | Playfair Display | `#e11d48` |
| `reyes` | Reyes Magos | ⭐ | Cinzel | `#7c3aed` |
| `mom` | Mother's Day | 🌸 | Lora | `#db2777` |
| `dad` | Father's Day | 👔 | Merriweather | `#1d4ed8` |
| `bday` | Birthday | 🎂 | Nunito | `#7c3aed` |
| `xmas` | Christmas | 🎄 | Mountains of Christmas | `#15803d` |

Add more by extending `TOPIC_PRESETS` in `packages/core/src/types/app.ts`.

---

## App Features

Each app enables any combination of sections:

| Feature | Description |
|---------|-------------|
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

## Admin Panel — Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — app grid, stats, search/filter, per-app Preview button |
| `/apps/new` | 4-step wizard: topic → theme → features → metadata |
| `/apps/:id` | Edit app config |
| `/apps/:id/analytics` | Per-app stats |
| `/infra/new` | 🐳 Local Docker simulation **or** ☁️ GCP provisioning |
| `/infra/deploy` | 🚀 Deploy to GCP via Cloud Build + Terraform |
| `/infra` | Infrastructure environments list |
| `/settings` | Admin settings |

---

## Local Development Workflow

### Run a specific app locally

Each themed app gets a **stable port** (assigned once, saved in `.dev-ports.json`):

```bash
# From terminal — shows build output
pnpm dev:app love    # → http://localhost:3010
pnpm dev:app mom     # → http://localhost:3011
pnpm dev:app dad     # → http://localhost:3012

# List running
pnpm dev:list

# Stop one
pnpm dev:stop love
```

### Preview from admin dashboard

Click **▶ Preview** on any app card → launches template on its port → opens browser after 5s boot.

Running apps show a live green badge: `● http://localhost:3010`.

### Local Docker simulation (test before GCP)

Tests the **exact same Docker image** that will be deployed to Cloud Run:

```bash
# Make sure Docker Desktop is running
# Open admin → /infra/new → select "🐳 Local (Docker)" mode
# Select app → click "Run in Docker"
```

Real-time SSE progress:
1. `Checking Docker daemon` — `docker info`
2. `Writing app config` — `.dev-configs/{slug}.json`
3. `Building Docker image` — `docker build apps/template`
4. `Starting container` — `docker run -p 301x:3000 -v .dev-configs:/dev-configs`
5. `Waiting for app to be ready` — health check
6. `Done` → `http://localhost:301x`

The image is reused on subsequent runs (step 3 skipped if already built).

### Config hot-reload

Change an app's theme/features in the admin → click **Sync** → running container picks up the new `.dev-configs/{slug}.json` on the next request (no restart needed).

---

## Creating New Apps

### Via Admin UI

1. Go to `/apps/new`
2. Pick topic → customize theme → select features → fill metadata
3. Click **Create App**
4. Click **▶ Preview** to launch locally

### Via CLI

```bash
pnpm new:app --topic=mom --name="Dia de las Madres" --slug=madres-2025
# Options: --topic, --name, --slug, --status (draft|active|archived)
```

---

## Firestore Schema

```
apps/{appId}
  id:            string
  name:          string
  slug:          string        # URL-safe identifier
  topic:         string        # love | reyes | mom | dad | bday | xmas | custom
  status:        draft | active | archived
  theme:
    primary:     string        # hex color
    secondary:   string
    accent:      string
    background:  string
    font:        string        # Google Font name
    emoji:       string
    gradient:    string[]
  features:      string[]      # hero | timeline | gallery | …
  metadata:
    title:       string
    description: string
    ogImage:     string?
  domain:        string?        # custom domain
  ownerId:       string?
  deployment:                   # filled by Cloud Build callback
    cloudRunUrl: string?
    hostingUrl:  string?
    projectId:   string?
    deployedAt:  string?
  createdAt:     Timestamp
  updatedAt:     Timestamp

apps/{appId}/moments/{momentId}
  userId:    string
  content:   string
  mediaUrl:  string?
  createdAt: Timestamp
```

---

## Deploying to GCP

### One-time setup

```bash
chmod +x infrastructure/gcp/setup.sh
./infrastructure/gcp/setup.sh <factory-project-id> <org-id> <billing-account>
```

This creates the service account with the right permissions and a Terraform state bucket.

### Deploy the admin (SASS Factory itself)

```bash
# Build and deploy the admin panel to Cloud Run
gcloud run deploy sass-factory-admin \
  --source apps/admin-fe \
  --region us-central1 \
  --project $GCP_PROJECT_ID \
  --set-env-vars "FIREBASE_API_KEY=...,FIREBASE_PROJECT_ID=...,GCP_PROJECT_ID=...,FACTORY_URL=...,TF_STATE_BUCKET=..."

# Get the URL
gcloud run services describe sass-factory-admin \
  --region us-central1 --format "value(status.url)"
```

### Deploy a themed app

From the admin UI:

1. Go to `/infra/deploy`
2. Select the app
3. Enter GCP Org ID and Billing Account
4. Click **🚀 Deploy to GCP**

Cloud Build pipeline (`infrastructure/cloudbuild/deploy-app.yaml`):

```
Step 1: tf-init         Terraform init (GCS backend)
Step 2: tf-apply        Create GCP project + enable APIs + Artifact Registry
Step 3: docker-build    Build template image
Step 4: docker-push     Push to Artifact Registry
Step 5: cloud-run-deploy Deploy to Cloud Run with APP_SLUG env
Step 6: notify-complete  POST back URLs to factory → Firestore updated
```

Live progress streamed via SSE to the admin UI.

### Terraform state

Each app gets its own state prefix in GCS:

```
gs://{TF_STATE_BUCKET}/terraform/apps/{slug}/
```

---

## Environment Variables

### `apps/admin-fe/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_API_KEY` | For Firebase mode | Firebase web API key |
| `FIREBASE_AUTH_DOMAIN` | For Firebase mode | `{project}.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | For Firebase mode | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | For Firebase mode | `{project}.appspot.com` |
| `FIREBASE_MESSAGING_SENDER_ID` | For Firebase mode | Messaging sender ID |
| `FIREBASE_APP_ID` | For Firebase mode | Firebase app ID |
| `GCP_PROJECT_ID` | For GCP deploy | Factory's GCP project ID |
| `FACTORY_URL` | For GCP deploy | Factory's Cloud Run URL |
| `TF_STATE_BUCKET` | For GCP deploy | GCS bucket for Terraform state |
| `CLOUD_BUILD_REPO` | For GCP deploy | Source repo name |

If none of the `FIREBASE_*` vars are set → **mock mode activates automatically**.

### `apps/template/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_SLUG` | Always | Identifies which app config to load |
| `FIREBASE_*` | For Firebase mode | Same as admin |
| `DEV_CONFIGS_DIR` | Docker only | Mount path for config files (`/dev-configs`) |

---

## Firestore Rules & Indexes

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy composite indexes
firebase deploy --only firestore:indexes

# Seed initial apps (love, reyes, mom, dad)
# Add service-account.json to infrastructure/firestore/ first (gitignored)
npx ts-node infrastructure/firestore/seed.ts
```

---

## CI/CD

GitHub Actions (requires PAT with `workflow` scope):

| Trigger | Jobs |
|---------|------|
| PR → `main` / `develop` | Typecheck all packages |
| Push → `main` | Deploy admin → Firebase Hosting |
| Push → `main` | Deploy template → Cloud Run |

### Required GitHub Secrets

```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
FIREBASE_SERVICE_ACCOUNT       # Firebase Hosting deploy key (JSON)
GCP_SERVICE_ACCOUNT_KEY        # Cloud Run deploy key (JSON)
GCP_PROJECT_ID
GCP_REGION
```

---

## Branches

| Branch | Purpose |
|--------|---------|
| `develop` | Active development — all PRs target here |
| `main` | Production — merging triggers deploys |

---

## Development Tips

**Rebuild Docker image after template changes:**
```bash
pnpm docker:build
```

**Stop all running app containers:**
```bash
pnpm docker:stop-all
```

**Force rebuild on simulate:**
The simulator reuses the image if it exists. Delete it to force rebuild:
```bash
docker rmi sass-factory/template:latest
# Then simulate again from admin
```

**Port collisions:**
Ports are permanently assigned in `.dev-ports.json`. Delete the file to reset all assignments.

**Logs for a running container:**
```bash
docker logs sass-love --follow
```
