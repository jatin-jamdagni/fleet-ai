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
  bun install --frozen-lockfile --filter ./apps/web

FROM deps AS builder
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
COPY apps/web apps/web
COPY packages/shared packages/shared
COPY packages/typescript-config packages/typescript-config
WORKDIR /repo/apps/web
RUN bun run build

FROM nginx:alpine
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
