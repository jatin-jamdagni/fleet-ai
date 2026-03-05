#!/usr/bin/env bash
set -euo pipefail

# Fleet AI — Deploy Script
# Usage: bash deploy.sh [--skip-pull] [--skip-models]

SKIP_PULL=false
SKIP_MODELS=false

for arg in "$@"; do
  case $arg in
    --skip-pull)   SKIP_PULL=true   ;;
    --skip-models) SKIP_MODELS=true ;;
  esac
done

cd "$(dirname "$0")/../.."

echo ""
echo "══════════════════════════════════════════"
echo "  🚀  FLEET AI — DEPLOY"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "══════════════════════════════════════════"
echo ""

# ── Load env ──────────────────────────────────────────────────────────────────
if [ ! -f .env.production ]; then
  echo "❌ .env.production not found"
  exit 1
fi
export $(grep -v '^#' .env.production | xargs)

# ── Git pull ──────────────────────────────────────────────────────────────────
if [ "$SKIP_PULL" = false ]; then
  echo "📥 Pulling latest code..."
  git pull origin main
  echo "✅ Code updated"
fi

# ── Build images ──────────────────────────────────────────────────────────────
echo "🔨 Building Docker images..."
docker compose -f docker-compose.prod.yml --env-file .env.production build \
  --no-cache \
  --parallel \
  backend web

echo "✅ Images built"

# ── Run migrations ────────────────────────────────────────────────────────────
echo "🗄️  Running database migrations..."
docker compose -f docker-compose.prod.yml --env-file .env.production run \
  --rm migrate
echo "✅ Migrations complete"

# ── Pull Ollama models ────────────────────────────────────────────────────────
if [ "$SKIP_MODELS" = false ]; then
  echo "🤖 Ensuring Ollama models are available..."
  docker compose -f docker-compose.prod.yml --env-file .env.production \
    up -d ollama

  sleep 5

  docker compose -f docker-compose.prod.yml --env-file .env.production \
    exec -T ollama ollama pull nomic-embed-text || true
  docker compose -f docker-compose.prod.yml --env-file .env.production \
    exec -T ollama ollama pull llama3 || true

  echo "✅ Ollama models ready"
fi

# ── Rolling restart ───────────────────────────────────────────────────────────
echo "♻️  Restarting services..."

# Start all services
docker compose -f docker-compose.prod.yml --env-file .env.production up -d \
  --remove-orphans

echo "⏳ Waiting for backend health check..."
MAX_WAIT=60
WAIT=0
until docker compose -f docker-compose.prod.yml --env-file .env.production \
    exec -T backend wget -qO- http://localhost:3000/health | grep -q '"ok"' 2>/dev/null; do
  if [ "$WAIT" -ge "$MAX_WAIT" ]; then
    echo "❌ Backend health check failed after ${MAX_WAIT}s"
    echo "Logs:"
    docker compose -f docker-compose.prod.yml logs --tail=50 backend
    exit 1
  fi
  echo "  ... waiting (${WAIT}s)"
  sleep 5
  WAIT=$((WAIT + 5))
done

echo "✅ Backend healthy"

# ── Cleanup ───────────────────────────────────────────────────────────────────
echo "🧹 Cleaning up old images..."
docker image prune -f --filter "until=24h" || true

# ── Final status ──────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  ✅  DEPLOY COMPLETE"
echo "══════════════════════════════════════════"
echo ""
docker compose -f docker-compose.prod.yml --env-file .env.production ps
echo ""
echo "Health: $(curl -s https://${ALLOWED_ORIGINS#*//}/health 2>/dev/null || echo 'check manually')"