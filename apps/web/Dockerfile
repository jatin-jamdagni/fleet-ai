# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

COPY package.json bun.lockb ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN bun install --frozen-lockfile

# Build Vite app
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_MAPBOX_TOKEN

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

RUN cd apps/web && bun run build

# ─── Stage 2: Serve via Nginx ─────────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config
COPY docker/nginx/web.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]