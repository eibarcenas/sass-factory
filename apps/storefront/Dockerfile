FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ── Install deps (monorepo context) ──────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY apps/storefront/package.json ./apps/storefront/

RUN pnpm install --frozen-lockfile --filter storefront...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY packages/core/ ./packages/core/
COPY apps/storefront/ ./apps/storefront/

ENV NEXT_TELEMETRY_DISABLED=1
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
COPY --from=builder --chown=nextjs:nodejs /repo/apps/storefront/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
