#!/usr/bin/env bash
set -euo pipefail

# Fleet AI — VPS Setup Script
# Usage: bash setup-vps.sh yourdomain.com your@email.com

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"

echo "🚀 Fleet AI — VPS Setup"
echo "Domain: $DOMAIN"
echo "Email:  $EMAIL"

# ── System updates ────────────────────────────────────────────────────────────
apt-get update -qq && apt-get upgrade -y -qq

# ── Install Docker ─────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "📦 Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "✅ Docker installed"
fi

# ── Install Docker Compose ─────────────────────────────────────────────────────
if ! command -v docker compose &>/dev/null; then
  echo "📦 Installing Docker Compose..."
  apt-get install -y docker-compose-plugin
fi

# ── UFW Firewall ───────────────────────────────────────────────────────────────
echo "🔒 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment "SSH"
ufw allow 80/tcp   comment "HTTP"
ufw allow 443/tcp  comment "HTTPS"
ufw --force enable
echo "✅ Firewall configured"

# ── Swap (for low-memory VPS) ──────────────────────────────────────────────────
if [ ! -f /swapfile ]; then
  echo "💾 Creating 2GB swap..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi

# ── Clone repo ────────────────────────────────────────────────────────────────
if [ ! -d /opt/fleet-ai ]; then
  echo "📥 Cloning Fleet AI..."
  git clone https://github.com/YOURUSER/fleet-ai.git /opt/fleet-ai
fi
cd /opt/fleet-ai

# ── Generate secrets ─────────────────────────────────────────────────────────
if [ ! -f .env.production ]; then
  echo "🔑 Generating secrets..."
  PG_PASS=$(openssl rand -hex 24)
  JWT_S=$(openssl rand -hex 32)
  JWT_R=$(openssl rand -hex 32)
  REDIS_P=$(openssl rand -hex 16)

  cat > .env.production << EOF
POSTGRES_PASSWORD=$PG_PASS
JWT_SECRET=$JWT_S
JWT_REFRESH_SECRET=$JWT_R
REDIS_PASSWORD=$REDIS_P
AI_PROVIDER=ollama
OLLAMA_CHAT_MODEL=llama3
OLLAMA_EMBED_MODEL=nomic-embed-text
VITE_API_URL=https://$DOMAIN/api/v1
VITE_WS_URL=wss://$DOMAIN
VITE_MAPBOX_TOKEN=ADD_YOUR_MAPBOX_TOKEN
ALLOWED_ORIGINS=https://$DOMAIN
EOF
  echo "✅ Secrets generated → .env.production"
  echo "⚠️  Add VITE_MAPBOX_TOKEN to .env.production before deploying web"
fi

# ── Replace domain in nginx config ────────────────────────────────────────────
sed -i "s/REPLACE_WITH_YOUR_DOMAIN/$DOMAIN/g" docker/nginx/nginx.conf

# ── Pull Ollama models (background) ──────────────────────────────────────────
echo "🤖 Pulling Ollama models (background)..."
docker pull ollama/ollama:latest &

# ── SSL Certificate ───────────────────────────────────────────────────────────
echo "🔐 Getting SSL certificate..."

# Temporarily use HTTP-only nginx to pass ACME challenge
docker run --rm \
  -v /opt/fleet-ai/certbot-conf:/etc/letsencrypt \
  -v /opt/fleet-ai/certbot-www:/var/www/certbot \
  -p 80:80 \
  --name certbot-init \
  certbot/certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  || echo "⚠️  SSL cert failed — running without HTTPS initially"

echo ""
echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "  1. Add VITE_MAPBOX_TOKEN to /opt/fleet-ai/.env.production"
echo "  2. cd /opt/fleet-ai && bash scripts/deploy/deploy.sh"