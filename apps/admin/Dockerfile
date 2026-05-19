FROM node:20-alpine AS base
RUN npm install -g pnpm

# Install all workspace dependencies
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY apps/admin/package.json ./apps/admin/
RUN pnpm install --frozen-lockfile

# Build admin
FROM deps AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/
RUN pnpm --filter admin build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install Docker CLI, kubectl, and kind (needed to build/load template images from inside the pod)
RUN apk add --no-cache docker-cli curl && \
    curl -Lo /usr/local/bin/kubectl \
      "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x /usr/local/bin/kubectl && \
    curl -Lo /usr/local/bin/kind \
      "https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64" && \
    chmod +x /usr/local/bin/kind

COPY --from=builder /app/apps/admin/.output ./.output
EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0
CMD ["node", ".output/server/index.mjs"]
