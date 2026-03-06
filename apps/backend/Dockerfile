# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3.8-alpine AS deps
WORKDIR /repo
COPY package.json bun.lock tsconfig.json turbo.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN --mount=type=cache,target=/root/.bun/install/cache \
  bun install --frozen-lockfile --filter ./apps/backend

FROM deps AS base
COPY apps/backend apps/backend
COPY packages/shared packages/shared
COPY packages/typescript-config packages/typescript-config
WORKDIR /repo/apps/backend
RUN bunx prisma generate
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
