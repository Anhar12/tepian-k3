# ---- Base ----
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
WORKDIR /app

# ---- Install dependencies ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/api/package.json ./packages/api/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/constants/package.json ./packages/constants/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/queries/package.json ./packages/queries/package.json
COPY packages/schema/package.json ./packages/schema/package.json
COPY packages/services/package.json ./packages/services/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- Build ----
FROM deps AS build
COPY . .
RUN pnpm turbo run build --filter=@tepian-k3/server

# ---- Production dependencies ----
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/api/package.json ./packages/api/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/constants/package.json ./packages/constants/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/queries/package.json ./packages/queries/package.json
COPY packages/schema/package.json ./packages/schema/package.json
COPY packages/services/package.json ./packages/services/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/utils/package.json ./packages/utils/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts --prod

# ---- Runner ----
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 server
RUN mkdir -p /app/uploads /app/logs /app/public && \
    chown -R server:nodejs /app/uploads /app/logs /app/public

# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=prod-deps /app/packages/db/node_modules ./packages/db/node_modules

# Copy built server
COPY --from=build /app/apps/server/dist ./dist
COPY --from=build /app/apps/server/assets ./assets

# Copy migration files (for migrate service)
COPY --from=build /app/packages/db/src/migrations ./packages/db/src/migrations
COPY --from=build /app/packages/db/drizzle.config.ts ./packages/db/drizzle.config.ts
COPY --from=build /app/packages/db/package.json ./packages/db/package.json

# Copy entrypoint
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER server

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
