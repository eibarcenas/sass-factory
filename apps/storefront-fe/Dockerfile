FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ── Install deps (monorepo context) ──────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY apps/storefront-fe/package.json ./apps/storefront-fe/

RUN pnpm install --frozen-lockfile --filter storefront-fe...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/core/ ./packages/core/
COPY packages/ui/ ./packages/ui/
COPY apps/storefront-fe/ ./apps/storefront-fe/

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_ADMIN_URL
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_SUPPORT_WHATSAPP
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CATALOG_API_URL
ARG NEXT_PUBLIC_IDENTITY_API_URL

ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_SUPPORT_WHATSAPP=$NEXT_PUBLIC_SUPPORT_WHATSAPP
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CATALOG_API_URL=$NEXT_PUBLIC_CATALOG_API_URL
ENV NEXT_PUBLIC_IDENTITY_API_URL=$NEXT_PUBLIC_IDENTITY_API_URL

RUN pnpm --filter storefront-fe build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront-fe/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront-fe/.next/static ./apps/storefront-fe/.next/static

USER nextjs
EXPOSE 8080
# monorepo standalone output nests server.js under the app path
WORKDIR /app/apps/storefront-fe
CMD ["node", "server.js"]
