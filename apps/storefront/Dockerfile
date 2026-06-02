FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ── Install deps (monorepo context) ──────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY apps/storefront/package.json ./apps/storefront/

RUN pnpm install --frozen-lockfile --filter storefront...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/core/ ./packages/core/
COPY packages/ui/ ./packages/ui/
COPY apps/storefront/ ./apps/storefront/

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_ADMIN_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL

# Firebase public config — baked at build time (client-side, not secrets)
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCIhK1icvEyOEYGZ2bn6yjbZt2Kc6YhILQ
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=catalog-mx-dev.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=catalog-mx-dev

# Client-side API URL for owner approve and admin action calls
ENV NEXT_PUBLIC_API_URL=https://catalog-mx-api-dev-q3peeste7q-uc.a.run.app

RUN pnpm --filter storefront build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront/.next/static ./apps/storefront/.next/static

USER nextjs
EXPOSE 8080
# monorepo standalone output nests server.js under the app path
WORKDIR /app/apps/storefront
CMD ["node", "server.js"]
