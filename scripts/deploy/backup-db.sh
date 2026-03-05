#!/usr/bin/env bash
set -euo pipefail

# Fleet AI — PostgreSQL Backup
# Usage: bash backup-db.sh
# Cron:  0 2 * * * /opt/fleet-ai/scripts/deploy/backup-db.sh

BACKUP_DIR="${BACKUP_DIR:-/opt/fleet-ai/backups}"
DATE=$(date +%Y%m%d-%H%M%S)
FILE="$BACKUP_DIR/fleet-db-$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

cd "$(dirname "$0")/../.."
export $(grep -v '^#' .env.production | xargs)

echo "📦 Backing up Fleet AI database..."

docker compose -f docker-compose.prod.yml --env-file .env.production \
  exec -T postgres \
  pg_dump -U fleet fleetai \
  | gzip > "$FILE"

SIZE=$(du -sh "$FILE" | cut -f1)
echo "✅ Backup: $FILE ($SIZE)"

# Keep last 14 days
find "$BACKUP_DIR" -name "fleet-db-*.sql.gz" -mtime +14 -delete
echo "🧹 Cleaned old backups (kept 14 days)"