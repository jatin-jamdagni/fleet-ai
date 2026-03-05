#!/usr/bin/env bash
set -euo pipefail

# Fleet AI — Rollback to previous image
# Usage: bash rollback.sh

cd "$(dirname "$0")/../.."
export $(grep -v '^#' .env.production | xargs)

echo "⏪ Fleet AI — Rollback"

# Tag current as bad
docker tag fleet-ai-backend:latest fleet-ai-backend:bad-$(date +%Y%m%d-%H%M%S) || true

# Find previous image
PREV=$(docker images fleet-ai-backend --format "{{.Tag}}" | grep -v latest | grep -v bad | head -1)

if [ -z "$PREV" ]; then
  echo "❌ No previous image found to roll back to"
  exit 1
fi

echo "Rolling back to: fleet-ai-backend:$PREV"
docker tag "fleet-ai-backend:$PREV" fleet-ai-backend:latest

docker compose -f docker-compose.prod.yml --env-file .env.production up -d backend
echo "✅ Rollback complete — running fleet-ai-backend:$PREV"