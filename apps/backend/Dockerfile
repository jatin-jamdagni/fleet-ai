# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM oven/bun:1.1-alpine AS deps

WORKDIR /app

# Copy root package files for workspace
COPY package.json bun.lockb ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

RUN bun install --frozen-lockfile --production

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

# Install all deps (including devDeps for build)
COPY package.json bun.lockb ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

RUN bun install --frozen-lockfile

# Generate Prisma client
RUN cd apps/backend && bunx prisma generate

# Build backend
RUN cd apps/backend && bun build src/index.ts \
  --outdir dist \
  --target bun \
  --minify \
  --external prisma

# ─── Stage 3: Production ─────────────────────────────────────────────────────
FROM oven/bun:1.1-alpine AS production

# Non-root user for security
RUN addgroup -S fleet && adduser -S fleet -G fleet

WORKDIR /app

# Copy built output
COPY --from=builder /app/apps/backend/dist          ./dist
COPY --from=builder /app/apps/backend/prisma        ./prisma
COPY --from=builder /app/node_modules               ./node_modules
COPY --from=builder /app/apps/backend/node_modules  ./apps/backend/node_modules

# Copy package.json for version info
COPY apps/backend/package.json ./

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

USER fleet

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["bun", "run", "dist/index.js"]