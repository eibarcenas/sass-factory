FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ── Install deps ──────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/landing/package.json ./apps/landing/

RUN pnpm install --frozen-lockfile --filter @catalog-mx/landing...

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo

COPY apps/landing/ ./apps/landing/

# Inject the admin URL at build time
ARG NEXT_PUBLIC_ADMIN_URL
ENV NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @catalog-mx/landing build

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/apps/landing/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/landing/.next/static ./apps/landing/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/landing/public ./apps/landing/public 2>/dev/null || true

USER nextjs
EXPOSE 8080
WORKDIR /app/apps/landing
CMD ["node", "server.js"]
