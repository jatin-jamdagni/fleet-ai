#!/bin/bash
echo "🗑️  Resetting Fleet AI database..."

docker-compose down -v
docker-compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec fleet_postgres pg_isready -U fleet -d fleetai; do
  sleep 2
done

echo "✅ Database reset complete!"
echo "   Now run: cd apps/backend && bun run db:migrate"