FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ── Install deps (monorepo context) ──────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY packages/auth/package.json ./packages/auth/
COPY packages/client/package.json ./packages/client/
COPY apps/admin/package.json ./apps/admin/

RUN pnpm install --frozen-lockfile --filter admin...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

# Firebase web API keys are public by design — security is enforced by
# Firebase Auth rules (domain restrictions) and Firestore rules.
ARG VITE_API_URL
ARG VITE_STOREFRONT_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_ADMIN_URL
ARG VITE_LANDING_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STOREFRONT_URL=$VITE_STOREFRONT_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_ADMIN_URL=$VITE_ADMIN_URL
ENV VITE_LANDING_URL=$VITE_LANDING_URL

COPY packages/core/ ./packages/core/
COPY packages/ui/ ./packages/ui/
COPY packages/auth/ ./packages/auth/
COPY packages/client/ ./packages/client/
COPY apps/admin/ ./apps/admin/

RUN pnpm --filter admin build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /repo/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
