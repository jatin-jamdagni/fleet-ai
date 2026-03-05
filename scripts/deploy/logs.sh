#!/usr/bin/env bash
# Fleet AI — Tail all service logs
# Usage: bash logs.sh [service] [lines]

SERVICE="${1:-}"
LINES="${2:-100}"

cd "$(dirname "$0")/../.."
export $(grep -v '^#' .env.production | xargs)

if [ -n "$SERVICE" ]; then
  docker compose -f docker-compose.prod.yml --env-file .env.production \
    logs -f --tail="$LINES" "$SERVICE"
else
  docker compose -f docker-compose.prod.yml --env-file .env.production \
    logs -f --tail="$LINES"
fi