#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
#  FLEET AI — Master Setup & Deploy Script
#  Usage: bash setup.sh
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; WHITE='\033[1;37m'; DIM='\033[2m'; NC='\033[0m'
BOLD='\033[1m'

# ── Helpers ───────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}▸${NC} $*"; }
success() { echo -e "${GREEN}✓${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✗${NC} $*"; exit 1; }
ask()     { echo -e "${YELLOW}?${NC}  ${BOLD}$1${NC}"; }
divider() { echo -e "${DIM}───────────────────────────────────────────────────────${NC}"; }
header()  {
  echo ""
  echo -e "${WHITE}${BOLD}$1${NC}"
  divider
}

# Prompt with default value
prompt() {
  local varname="$1" question="$2" default="$3"
  ask "$question"
  echo -e "  ${DIM}(default: $default — press Enter to keep)${NC}"
  read -r -p "  → " input
  eval "$varname=\"${input:-$default}\""
}

# Yes/No prompt → returns 0 (yes) or 1 (no)
confirm() {
  local question="$1" default="${2:-y}"
  ask "$question [y/n] (default: $default)"
  read -r -p "  → " input
  input="${input:-$default}"
  [[ "$input" =~ ^[Yy] ]]
}

# Menu selector
menu() {
  local varname="$1" question="$2"; shift 2
  local options=("$@")
  local choice idx
  ask "$question"
  for i in "${!options[@]}"; do
    echo -e "  ${CYAN}$((i+1))${NC}) ${options[$i]}"
  done
  while true; do
    read -r -p "  → " choice
    if [[ -z "$choice" ]]; then
      idx=0
      break
    fi
    if [[ "$choice" =~ ^[0-9]+$ ]] && (( choice >= 1 && choice <= ${#options[@]} )); then
      idx=$((choice - 1))
      break
    fi
    warn "Please enter a number between 1 and ${#options[@]} (or press Enter for 1)."
  done
  eval "$varname=\"${options[$idx]}\""
}

# Detect local IP
detect_local_ip() {
  if command -v ip &>/dev/null; then
    ip route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i <= NF; i++) if ($i == "src") {print $(i+1); exit}}'
  elif command -v ipconfig &>/dev/null; then
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost"
  elif command -v ifconfig &>/dev/null; then
    ifconfig | awk '/inet / && $2 != "127.0.0.1" {print $2; exit}'
  else
    echo "localhost"
  fi
}

collect_missing_stripe_fields() {
  STRIPE_MISSING_FIELDS=()
  [[ -z "${STRIPE_SECRET_KEY:-}" ]]       && STRIPE_MISSING_FIELDS+=("STRIPE_SECRET_KEY (apps/backend/.env)")
  [[ -z "${STRIPE_WEBHOOK_SECRET:-}" ]]   && STRIPE_MISSING_FIELDS+=("STRIPE_WEBHOOK_SECRET (apps/backend/.env)")
  [[ -z "${STRIPE_PRICE_STARTER:-}" ]]    && STRIPE_MISSING_FIELDS+=("STRIPE_PRICE_STARTER (apps/backend/.env)")
  [[ -z "${STRIPE_PRICE_PRO:-}" ]]        && STRIPE_MISSING_FIELDS+=("STRIPE_PRICE_PRO (apps/backend/.env)")
  [[ -z "${STRIPE_PRICE_ENTERPRISE:-}" ]] && STRIPE_MISSING_FIELDS+=("STRIPE_PRICE_ENTERPRISE (apps/backend/.env)")
  [[ -z "${STRIPE_PUBLISHABLE_KEY:-}" ]]  && STRIPE_MISSING_FIELDS+=("VITE_STRIPE_PUBLISHABLE_KEY (apps/web/.env)")
}

# ══════════════════════════════════════════════════════════════════════════════
#  BANNER
# ══════════════════════════════════════════════════════════════════════════════
clear 2>/dev/null || true
echo -e "${YELLOW}"
cat << 'BANNER'
 ███████╗██╗     ███████╗███████╗████████╗     █████╗ ██╗
 ██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝    ██╔══██╗██║
 █████╗  ██║     █████╗  █████╗     ██║       ███████║██║
 ██╔══╝  ██║     ██╔══╝  ██╔══╝     ██║       ██╔══██║██║
 ██║     ███████╗███████╗███████╗   ██║       ██║  ██║██║
 ╚═╝     ╚══════╝╚══════╝╚══════╝   ╚═╝       ╚═╝  ╚═╝╚═╝
BANNER
echo -e "${NC}"
echo -e "${WHITE}${BOLD}  Fleet Management Platform — Setup & Deploy${NC}"
echo -e "${DIM}  This script configures and deploys your entire Fleet AI stack.${NC}"
echo ""

# ══════════════════════════════════════════════════════════════════════════════
#  STEP 1 — DEPLOYMENT MODE
# ══════════════════════════════════════════════════════════════════════════════
header "STEP 1 — Deployment Mode"

menu DEPLOY_MODE "How do you want to run Fleet AI?" \
  "local-docker   (Docker Compose — everything in containers, recommended)" \
  "local-native   (Run bun/node directly on this machine, no Docker)" \
  "production     (Docker Compose with Nginx + SSL, for a real server)"

# Parse shortname
case "$DEPLOY_MODE" in
  local-docker*)   DEPLOY_MODE="local-docker" ;;
  local-native*)   DEPLOY_MODE="local-native" ;;
  production*)     DEPLOY_MODE="production" ;;
esac
success "Deploy mode: $DEPLOY_MODE"

# ══════════════════════════════════════════════════════════════════════════════
#  STEP 2 — DATA MODE
# ══════════════════════════════════════════════════════════════════════════════
header "STEP 2 — Data Mode"

echo -e "  ${DIM}DEMO mode seeds the database with realistic fake data (vehicles, drivers, trips, invoices).${NC}"
echo -e "  ${DIM}LIVE mode starts with a clean database for real use.${NC}"
echo ""

menu DATA_MODE "Which data mode?" \
  "demo   (Seed with fake vehicles, drivers, GPS trips, invoices — great for testing)" \
  "live   (Empty database — start fresh for production use)"

case "$DATA_MODE" in
  demo*) DATA_MODE="demo" ;;
  live*) DATA_MODE="live" ;;
esac
success "Data mode: $DATA_MODE"

if [[ "$DATA_MODE" == "demo" ]]; then
  prompt DEMO_VEHICLES "How many demo vehicles?" "8"
  prompt DEMO_DRIVERS  "How many demo drivers?"  "5"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  STEP 3 — NETWORK / HOST CONFIG
# ══════════════════════════════════════════════════════════════════════════════
header "STEP 3 — Network & Host"

LOCAL_IP=$(detect_local_ip)
info "Detected local IP: ${WHITE}$LOCAL_IP${NC}"
echo ""

if [[ "$DEPLOY_MODE" == "production" ]]; then
  prompt HOST "Production domain (e.g. fleet.mycompany.com)" "fleet.example.com"
else
  prompt HOST "Host IP or hostname for the network" "$LOCAL_IP"
fi

prompt BACKEND_PORT  "Backend API port"  "3000"
prompt WEB_PORT      "Web dashboard port" "5173"

if [[ "$DEPLOY_MODE" == "production" ]]; then
  BACKEND_URL="https://$HOST/api/v1"
  WS_URL="wss://$HOST"
  FRONTEND_URL="https://$HOST"
else
  BACKEND_URL="http://$HOST:${BACKEND_PORT}/api/v1"
  WS_URL="ws://$HOST:${BACKEND_PORT}"
  FRONTEND_URL="http://$HOST:${WEB_PORT}"
fi

success "Backend:  $BACKEND_URL"
success "WebSocket: $WS_URL"
success "Frontend:  $FRONTEND_URL"

# ══════════════════════════════════════════════════════════════════════════════
#  STEP 4 — DATABASE
# ══════════════════════════════════════════════════════════════════════════════
header "STEP 4 — Database"

menu DB_MODE "Database setup?" \
  "docker    (Spin up PostgreSQL in Docker — easiest)" \
  "existing  (Use an existing PostgreSQL URL)"

case "$DB_MODE" in
  docker*)   DB_MODE="docker" ;;
  existing*) DB_MODE="existing" ;;
esac

if [[ "$DB_MODE" == "docker" ]]; then
  prompt DB_NAME     "Database name"     "fleetai"
  prompt DB_USER     "Database user"     "fleetai"
  if [[ "$DEPLOY_MODE" == "local-docker" ]]; then
    prompt DB_PASSWORD "Database password" "fleetai"
  else
    prompt DB_PASSWORD "Database password" "fleetai_$(openssl rand -hex 6 2>/dev/null || echo 'secret123')"
  fi
  DB_HOST="postgres"
  [[ "$DEPLOY_MODE" == "local-native" ]] && DB_HOST="localhost"
  DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME"
  success "Database URL: postgresql://$DB_USER:****@$DB_HOST:5432/$DB_NAME"
else
  prompt DATABASE_URL "PostgreSQL connection URL" "postgresql://user:password@host:5432/fleetai"
  DB_NAME=""
  DB_USER=""
  DB_PASSWORD=""
  success "Using provided DATABASE_URL"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  STEP 5 — AUTH & SECRETS
# ══════════════════════════════════════════════════════════════════════════════
header "STEP 5 — Auth & Secrets"

gen_secret() { openssl rand -base64 48 2>/dev/null | tr -dc 'a-zA-Z0-9' | head -c 64; }

JWT_SECRET=$(gen_secret)
JWT_REFRESH_SECRET=$(gen_secret)
info "JWT secrets auto-generated."

if [[ "$DEPLOY_MODE" == "production" ]]; then
  prompt JWT_SECRET         "JWT access secret (leave blank to keep generated)" "$JWT_SECRET"
  prompt JWT_REFRESH_SECRET "JWT refresh secret (leave blank to keep generated)" "$JWT_REFRESH_SECRET"
fi

# ══════════════════════════════════════════════════════════════════════════════
#  STEP 6 — OPTIONAL INTEGRATIONS
# ══════════════════════════════════════════════════════════════════════════════
header "STEP 6 — Optional Integrations (press Enter to skip)"

echo -e "  ${DIM}All integrations below are optional. Leaving them blank will NOT block setup/deploy.${NC}"
echo -e "  ${DIM}Stripe requires all fields to be set before checkout/portal/webhook flows will work.${NC}"
echo ""

prompt SENTRY_DSN          "Sentry DSN (backend)"       ""
prompt SENTRY_WEB_DSN      "Sentry DSN (web)"           ""
prompt RESEND_API_KEY       "Resend API key (emails)"    ""
prompt EMAIL_FROM           "From address for emails"    "Fleet AI <noreply@${HOST}>"

if [[ "$DATA_MODE" == "demo" ]]; then
  if confirm "Configure Stripe TEST mode now for demo billing?" "y"; then
    prompt STRIPE_SECRET_KEY      "STRIPE_SECRET_KEY (backend, starts with sk_test_)" ""
    prompt STRIPE_WEBHOOK_SECRET  "STRIPE_WEBHOOK_SECRET (backend, starts with whsec_)" ""
    prompt STRIPE_PRICE_STARTER   "STRIPE_PRICE_STARTER (backend, price_...)" ""
    prompt STRIPE_PRICE_PRO       "STRIPE_PRICE_PRO (backend, price_...)" ""
    prompt STRIPE_PRICE_ENTERPRISE "STRIPE_PRICE_ENTERPRISE (backend, price_...)" ""
    prompt STRIPE_PUBLISHABLE_KEY "VITE_STRIPE_PUBLISHABLE_KEY (web, starts with pk_test_)" ""
  else
    STRIPE_SECRET_KEY=""
    STRIPE_WEBHOOK_SECRET=""
    STRIPE_PRICE_STARTER=""
    STRIPE_PRICE_PRO=""
    STRIPE_PRICE_ENTERPRISE=""
    STRIPE_PUBLISHABLE_KEY=""
  fi
else
  prompt STRIPE_SECRET_KEY       "STRIPE secret key (backend)"         ""
  prompt STRIPE_WEBHOOK_SECRET   "Stripe webhook secret (backend)"      ""
  prompt STRIPE_PRICE_STARTER    "Stripe price ID Starter (backend)"    ""
  prompt STRIPE_PRICE_PRO        "Stripe price ID Pro (backend)"        ""
  prompt STRIPE_PRICE_ENTERPRISE "Stripe price ID Enterprise (backend)" ""
  prompt STRIPE_PUBLISHABLE_KEY  "Stripe publishable key (web)"         ""
fi

prompt OPENAI_API_KEY        "OpenAI API key (for AI assistant)" ""
prompt OLLAMA_BASE_URL       "Ollama URL (local AI)"     "http://localhost:11434"
prompt EXPO_PROJECT_ID       "Expo project ID (mobile push)" ""

collect_missing_stripe_fields
if [[ -n "${STRIPE_SECRET_KEY}${STRIPE_WEBHOOK_SECRET}${STRIPE_PRICE_STARTER}${STRIPE_PRICE_PRO}${STRIPE_PRICE_ENTERPRISE}${STRIPE_PUBLISHABLE_KEY}" && ${#STRIPE_MISSING_FIELDS[@]} -gt 0 ]]; then
  warn "Stripe was partially configured. Missing required fields:"
  for field in "${STRIPE_MISSING_FIELDS[@]}"; do
    echo -e "  - ${field}"
  done

  if confirm "Do you want to fill missing Stripe fields now?" "y"; then
    [[ -z "$STRIPE_SECRET_KEY" ]]       && prompt STRIPE_SECRET_KEY      "STRIPE_SECRET_KEY (backend)"         ""
    [[ -z "$STRIPE_WEBHOOK_SECRET" ]]   && prompt STRIPE_WEBHOOK_SECRET  "STRIPE_WEBHOOK_SECRET (backend)"     ""
    [[ -z "$STRIPE_PRICE_STARTER" ]]    && prompt STRIPE_PRICE_STARTER   "STRIPE_PRICE_STARTER (backend)"      ""
    [[ -z "$STRIPE_PRICE_PRO" ]]        && prompt STRIPE_PRICE_PRO       "STRIPE_PRICE_PRO (backend)"          ""
    [[ -z "$STRIPE_PRICE_ENTERPRISE" ]] && prompt STRIPE_PRICE_ENTERPRISE "STRIPE_PRICE_ENTERPRISE (backend)" ""
    [[ -z "$STRIPE_PUBLISHABLE_KEY" ]]  && prompt STRIPE_PUBLISHABLE_KEY "VITE_STRIPE_PUBLISHABLE_KEY (web)"  ""
    collect_missing_stripe_fields
  fi

  if [[ ${#STRIPE_MISSING_FIELDS[@]} -gt 0 ]]; then
    warn "Continuing with Stripe disabled so the full stack still runs."
    STRIPE_SECRET_KEY=""
    STRIPE_WEBHOOK_SECRET=""
    STRIPE_PRICE_STARTER=""
    STRIPE_PRICE_PRO=""
    STRIPE_PRICE_ENTERPRISE=""
    STRIPE_PUBLISHABLE_KEY=""
  fi
fi

# ══════════════════════════════════════════════════════════════════════════════
#  STEP 7 — GRAFANA / MONITORING
# ══════════════════════════════════════════════════════════════════════════════
header "STEP 7 — Monitoring"

if confirm "Enable Prometheus + Grafana monitoring?" "y"; then
  MONITORING=true
  prompt GRAFANA_PASSWORD "Grafana admin password" "fleet_$(openssl rand -hex 4 2>/dev/null || echo 'admin')"
  prompt GRAFANA_PORT     "Grafana port"            "3001"
else
  MONITORING=false
  GRAFANA_PASSWORD=""
  GRAFANA_PORT="3001"
fi

IS_DEV=true
IS_PRODUCTION=false
NODE_ENV="development"
LOG_LEVEL="info"
if [[ "$DEPLOY_MODE" == "production" ]]; then
  IS_DEV=false
  IS_PRODUCTION=true
  NODE_ENV="production"
  LOG_LEVEL="warn"
fi

AI_PROVIDER="ollama"
if [[ -n "$OPENAI_API_KEY" ]]; then
  AI_PROVIDER="openai"
fi

STRIPE_ENABLED=false
STRIPE_MODE="disabled"
if [[ -n "$STRIPE_SECRET_KEY" && -n "$STRIPE_WEBHOOK_SECRET" && -n "$STRIPE_PRICE_STARTER" && -n "$STRIPE_PRICE_PRO" && -n "$STRIPE_PRICE_ENTERPRISE" && -n "$STRIPE_PUBLISHABLE_KEY" ]]; then
  STRIPE_ENABLED=true
  STRIPE_MODE="live"
  if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
    STRIPE_MODE="test"
  fi
fi

# ══════════════════════════════════════════════════════════════════════════════
#  GENERATE ALL CONFIG FILES
# ══════════════════════════════════════════════════════════════════════════════
header "Generating configuration files…"

# ─── Master config (fleet.config.ts) ─────────────────────────────────────────
mkdir -p config

cat > config/fleet.config.ts << FLEETCONFIG
// ═══════════════════════════════════════════════════════════════════════════
//  FLEET AI — Master Configuration
//  Auto-generated by setup.sh — edit this file to change settings.
//  Run \`bash setup.sh\` again to regenerate.
// ═══════════════════════════════════════════════════════════════════════════

export const config = {

  // ── Deployment ────────────────────────────────────────────────────────────
  deployMode:   "${DEPLOY_MODE}" as const,  // local-docker | local-native | production
  dataMode:     "${DATA_MODE}"   as const,  // demo | live
  host:         "${HOST}",
  isDev:        ${IS_DEV},
  isProduction: ${IS_PRODUCTION},

  // ── URLs ──────────────────────────────────────────────────────────────────
  urls: {
    backend:    "${BACKEND_URL}",
    websocket:  "${WS_URL}",
    frontend:   "${FRONTEND_URL}",
  },

  // ── Ports ─────────────────────────────────────────────────────────────────
  ports: {
    backend:  ${BACKEND_PORT},
    web:      ${WEB_PORT},
    grafana:  ${GRAFANA_PORT},
    postgres: 5432,
    redis:    6379,
  },

  // ── Database ──────────────────────────────────────────────────────────────
  database: {
    mode:   "${DB_MODE}" as const,         // docker | existing
    url:    process.env.DATABASE_URL ?? "${DATABASE_URL}",
  },

  // ── Demo seed config ──────────────────────────────────────────────────────
  demo: {
    enabled:       "${DATA_MODE}" === "demo",
    vehicleCount:  ${DEMO_VEHICLES:-8},
    driverCount:   ${DEMO_DRIVERS:-5},
    managerEmail:  "manager@bharatlogistics.in",
    managerPass:   "Manager@123",
    driverEmail:   "driver1@bharatlogistics.in",
    driverPass:    "Driver@123",
    orgName:       "Bharat Logistics Pvt. Ltd.",
    orgSlug:       "bharat-logistics",
  },

  // ── Stripe billing (SaaS subscription checkout) ───────────────────────────
  stripe: {
    enabled: ${STRIPE_ENABLED},
    mode: "${STRIPE_MODE}" as "disabled" | "test" | "live",
    publishableKey: "${STRIPE_PUBLISHABLE_KEY}",
    priceIds: {
      starter: "${STRIPE_PRICE_STARTER}",
      pro: "${STRIPE_PRICE_PRO}",
      enterprise: "${STRIPE_PRICE_ENTERPRISE}",
    },
  },

  // ── Monitoring ────────────────────────────────────────────────────────────
  monitoring: {
    enabled:         ${MONITORING},
    grafanaPort:     ${GRAFANA_PORT},
    prometheusPort:  9090,
  },

  // ── Mobile (Expo) ─────────────────────────────────────────────────────────
  mobile: {
    apiUrl:     "${BACKEND_URL}",
    wsUrl:      "${WS_URL}",
    projectId:  "${EXPO_PROJECT_ID}",
  },

} as const;

export type Config = typeof config;
export default config;
FLEETCONFIG
success "config/fleet.config.ts"

# ─── Backend .env ─────────────────────────────────────────────────────────────
cat > apps/backend/.env << BACKENDENV
# ═══════════════════════════════════════════════════════════════════════════════
#  FLEET AI — Backend Environment
#  Auto-generated by setup.sh
# ═══════════════════════════════════════════════════════════════════════════════

# ── App ──────────────────────────────────────────────────────────────────────
NODE_ENV=${NODE_ENV}
PORT=${BACKEND_PORT}
HOST=0.0.0.0
FRONTEND_URL=${FRONTEND_URL}
LOG_LEVEL=${LOG_LEVEL}

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=${DATABASE_URL}

# ── Auth ─────────────────────────────────────────────────────────────────────
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ── Data Mode ─────────────────────────────────────────────────────────────────
DATA_MODE=${DATA_MODE}
DEMO_VEHICLES=${DEMO_VEHICLES:-8}
DEMO_DRIVERS=${DEMO_DRIVERS:-5}

# ── AI ───────────────────────────────────────────────────────────────────────
OPENAI_API_KEY=${OPENAI_API_KEY}
OLLAMA_BASE_URL=${OLLAMA_BASE_URL}
AI_PROVIDER=${AI_PROVIDER}

# ── Email ─────────────────────────────────────────────────────────────────────
RESEND_API_KEY=${RESEND_API_KEY}
EMAIL_FROM=${EMAIL_FROM}

# ── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_ENABLED=${STRIPE_ENABLED}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
STRIPE_PRICE_STARTER=${STRIPE_PRICE_STARTER}
STRIPE_PRICE_PRO=${STRIPE_PRICE_PRO}
STRIPE_PRICE_ENTERPRISE=${STRIPE_PRICE_ENTERPRISE}

# ── Monitoring ────────────────────────────────────────────────────────────────
SENTRY_DSN=${SENTRY_DSN}

# ── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=${FRONTEND_URL},http://localhost:5173,http://${HOST}:${WEB_PORT}
BACKENDENV
success "apps/backend/.env"

# ─── Web .env ─────────────────────────────────────────────────────────────────
cat > apps/web/.env << WEBENV
# ═══════════════════════════════════════════════════════════════════════════════
#  FLEET AI — Web Dashboard Environment
#  Auto-generated by setup.sh
# ═══════════════════════════════════════════════════════════════════════════════
VITE_API_URL=${BACKEND_URL}
VITE_WS_URL=${WS_URL}
VITE_APP_NAME=Fleet AI
VITE_DATA_MODE=${DATA_MODE}
VITE_SENTRY_DSN=${SENTRY_WEB_DSN}
VITE_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
WEBENV
success "apps/web/.env"

# ─── Mobile .env ──────────────────────────────────────────────────────────────
cat > apps/mobile/.env << MOBILEENV
# ═══════════════════════════════════════════════════════════════════════════════
#  FLEET AI — Mobile App Environment
#  Auto-generated by setup.sh
# ═══════════════════════════════════════════════════════════════════════════════
EXPO_PUBLIC_API_URL=${BACKEND_URL}
EXPO_PUBLIC_WS_URL=${WS_URL}
EXPO_PUBLIC_APP_NAME=Fleet AI
EXPO_PUBLIC_DATA_MODE=${DATA_MODE}
EXPO_PUBLIC_PROJECT_ID=${EXPO_PROJECT_ID}
MOBILEENV
success "apps/mobile/.env"

# ── Docker Compose (local) ───────────────────────────────────────────────────
cat > docker-compose.yml << COMPOSE
# ═══════════════════════════════════════════════════════════════════════════════
#  FLEET AI — Docker Compose (Local / Development)
#  Auto-generated by setup.sh
#  Usage: docker compose up -d
# ═══════════════════════════════════════════════════════════════════════════════
networks:
  fleet-net:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
$([ "$MONITORING" = "true" ] && printf "  prometheus-data:\n  grafana-data:")

services:

  # ── PostgreSQL ──────────────────────────────────────────────────────────────
  postgres:
    image: postgis/postgis:16-3.4
    restart: unless-stopped
    environment:
      POSTGRES_DB:       ${DB_NAME:-fleetai}
      POSTGRES_USER:     ${DB_USER:-fleetai}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - fleet-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-fleetai}"]
      interval: 5s
      timeout:  3s
      retries:  10

  # ── Redis ───────────────────────────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - fleet-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  # ── Backend ─────────────────────────────────────────────────────────────────
  backend:
    build:
      context: .
      dockerfile: ./apps/backend/Dockerfile
    restart: unless-stopped
    env_file: ./apps/backend/.env
    environment:
      DATABASE_URL: "${DATABASE_URL}"
      REDIS_URL:    redis://redis:6379
    ports:
      - "${BACKEND_PORT}:${BACKEND_PORT}"
    networks:
      - fleet-net
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "bun", "-e", "fetch('http://localhost:${BACKEND_PORT}/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
      interval: 10s
      timeout:  5s
      retries:  5

  # ── Web Dashboard ────────────────────────────────────────────────────────────
  web:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
      args:
        VITE_API_URL: ${BACKEND_URL}
        VITE_WS_URL:  ${WS_URL}
    restart: unless-stopped
    ports:
      - "${WEB_PORT}:80"
    networks:
      - fleet-net
    depends_on:
      - backend
COMPOSE

# Append monitoring services if enabled
if [[ "$MONITORING" == "true" ]]; then
cat >> docker-compose.yml << MONCOMP

  # ── Prometheus ──────────────────────────────────────────────────────────────
  prometheus:
    image: prom/prometheus:v2.50.0
    restart: unless-stopped
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=30d"
    ports:
      - "9090:9090"
    networks:
      - fleet-net

  # ── Grafana ─────────────────────────────────────────────────────────────────
  grafana:
    image: grafana/grafana:10.3.0
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER:     admin
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_USERS_ALLOW_SIGN_UP:    "false"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./docker/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./docker/grafana/dashboards:/var/lib/grafana/dashboards:ro
    ports:
      - "${GRAFANA_PORT}:3000"
    networks:
      - fleet-net
    depends_on:
      - prometheus
MONCOMP
fi
success "docker-compose.yml"

# ── Docker Compose (production) ───────────────────────────────────────────────
cat > docker-compose.prod.yml << PRODCOMPOSE
# ═══════════════════════════════════════════════════════════════════════════════
#  FLEET AI — Docker Compose (Production with Nginx + SSL)
#  Usage: docker compose -f docker-compose.prod.yml up -d
# ═══════════════════════════════════════════════════════════════════════════════
networks:
  fleet-net:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  certbot-conf:
  certbot-www:
$([ "$MONITORING" = "true" ] && printf "  prometheus-data:\n  grafana-data:")

services:

  postgres:
    image: postgis/postgis:16-3.4
    restart: always
    environment:
      POSTGRES_DB:       ${DB_NAME:-fleetai}
      POSTGRES_USER:     ${DB_USER:-fleetai}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - fleet-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-fleetai}"]
      interval: 5s

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis-data:/data
    networks:
      - fleet-net

  backend:
    build:
      context: .
      dockerfile: ./apps/backend/Dockerfile
    restart: always
    env_file: ./apps/backend/.env
    environment:
      DATABASE_URL: "${DATABASE_URL}"
      REDIS_URL:    redis://redis:6379
      NODE_ENV:     production
    networks:
      - fleet-net
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
      args:
        VITE_API_URL: https://${HOST}/api/v1
        VITE_WS_URL:  wss://${HOST}
    restart: always
    networks:
      - fleet-net
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - certbot-conf:/etc/letsencrypt:ro
      - certbot-www:/var/www/certbot:ro
    networks:
      - fleet-net
    depends_on:
      - backend
      - web

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-conf:/etc/letsencrypt
      - certbot-www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"

$([ "$MONITORING" = "true" ] && cat << 'MONPROD'
  prometheus:
    image: prom/prometheus:v2.50.0
    restart: always
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - fleet-net

  grafana:
    image: grafana/grafana:10.3.0
    restart: always
    environment:
      GF_SECURITY_ADMIN_USER:        admin
      GF_SECURITY_ADMIN_PASSWORD:    ${GRAFANA_PASSWORD}
      GF_SERVER_ROOT_URL:            https://${HOST}/grafana
      GF_SERVER_SERVE_FROM_SUB_PATH: "true"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./docker/grafana/provisioning:/etc/grafana/provisioning:ro
    networks:
      - fleet-net
MONPROD
)
PRODCOMPOSE
success "docker-compose.prod.yml"

# ── Nginx (local dev) ─────────────────────────────────────────────────────────
mkdir -p docker/nginx
cat > docker/nginx/nginx.conf << NGINX
worker_processes auto;
events { worker_connections 1024; }
http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;
  sendfile      on;
  gzip on; gzip_types text/plain text/css application/javascript application/json;

  upstream backend { server backend:${BACKEND_PORT}; }
  upstream web     { server web:80; }

  server {
    listen 80;
    server_name _;

    location /api/    { proxy_pass http://backend; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; }
    location /ws      { proxy_pass http://backend; proxy_http_version 1.1; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection "Upgrade"; proxy_set_header Host \$host; proxy_read_timeout 3600; }
    location /metrics { proxy_pass http://backend; }
    location /health  { proxy_pass http://backend; }
    location /        { proxy_pass http://web; proxy_set_header Host \$host; }
  }
}
NGINX
success "docker/nginx/nginx.conf"

# ── Nginx (production with SSL) ───────────────────────────────────────────────
cat > docker/nginx/nginx.prod.conf << NGINXPROD
worker_processes auto;
events { worker_connections 4096; }
http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;
  sendfile      on;
  gzip on; gzip_types text/plain text/css application/javascript application/json;
  client_max_body_size 50M;

  upstream backend { server backend:${BACKEND_PORT}; }
  upstream web     { server web:80; }

  # Redirect HTTP → HTTPS
  server {
    listen 80;
    server_name ${HOST};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://\$host\$request_uri; }
  }

  server {
    listen 443 ssl http2;
    server_name ${HOST};

    ssl_certificate     /etc/letsencrypt/live/${HOST}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${HOST}/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;

    location /api/    { proxy_pass http://backend; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-Proto https; }
    location /ws      { proxy_pass http://backend; proxy_http_version 1.1; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection "Upgrade"; proxy_set_header Host \$host; proxy_read_timeout 3600; }
    location /metrics { proxy_pass http://backend; allow 127.0.0.1; deny all; }
    location /health  { proxy_pass http://backend; }
    location /grafana { proxy_pass http://grafana:3000; proxy_set_header Host \$host; }
    location /        { proxy_pass http://web; proxy_set_header Host \$host; try_files \$uri \$uri/ /index.html; }
  }
}
NGINXPROD
success "docker/nginx/nginx.prod.conf"

# ── Postgres init ─────────────────────────────────────────────────────────────
mkdir -p docker/postgres
cat > docker/postgres/init.sql << 'SQL'
-- Fleet AI database init
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
SQL
success "docker/postgres/init.sql"

# ── Prometheus config ─────────────────────────────────────────────────────────
mkdir -p docker/prometheus
cat > docker/prometheus/prometheus.yml << PROM
global:
  scrape_interval:     15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: fleet-backend
    static_configs:
      - targets: ["backend:${BACKEND_PORT}"]
    metrics_path: /metrics
    scrape_interval: 10s

  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
PROM
success "docker/prometheus/prometheus.yml"

# ── Grafana provisioning ──────────────────────────────────────────────────────
mkdir -p docker/grafana/provisioning/datasources
mkdir -p docker/grafana/provisioning/dashboards
mkdir -p docker/grafana/dashboards

cat > docker/grafana/provisioning/datasources/prometheus.yml << 'GRAFDS'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
GRAFDS

cat > docker/grafana/provisioning/dashboards/fleet.yml << 'GRAFDB'
apiVersion: 1
providers:
  - name: Fleet AI
    type: file
    options:
      path: /var/lib/grafana/dashboards
GRAFDB
success "docker/grafana (provisioning)"

# ── Backend Dockerfile ────────────────────────────────────────────────────────
mkdir -p apps/backend
cat > apps/backend/Dockerfile << 'BEFILE'
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
BEFILE
success "apps/backend/Dockerfile"

# ── Web Dockerfile ────────────────────────────────────────────────────────────
mkdir -p apps/web
cat > apps/web/Dockerfile << 'WEFILE'
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
WEFILE

cat > apps/web/nginx-spa.conf << 'SPANGINX'
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  gzip on;
  gzip_types text/plain text/css application/javascript application/json;
  location / { try_files $uri $uri/ /index.html; }
  location ~* \.(js|css|png|jpg|svg|ico|woff2)$ { expires 1y; add_header Cache-Control "public, immutable"; }
}
SPANGINX
success "apps/web/Dockerfile + nginx-spa.conf"

# ── Demo seed script ───────────────────────────────────────────────────────────
if [[ -f apps/backend/src/db/seed.ts ]]; then
  success "apps/backend/src/db/seed.ts (kept existing)"
else
  warn "apps/backend/src/db/seed.ts not found. Creating a minimal compatible demo seed."
  cat > apps/backend/src/db/seed.ts << 'SEED'
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Plan, Role } from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const DATA_MODE = process.env.DATA_MODE ?? "live";

async function main() {
  if (DATA_MODE !== "demo") {
    console.log("DATA_MODE is not 'demo' — skipping seed.");
    return;
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: "fleet-demo" },
    update: {},
    create: {
      name: "Fleet Demo Co",
      slug: "fleet-demo",
      plan: Plan.PROFESSIONAL,
      countryCode: "US",
      currency: "USD",
      operatingRegions: ["domestic"],
      cargoTypes: ["general"],
    },
  });

  const managerPassword = await Bun.password.hash("Manager123!", { algorithm: "bcrypt", cost: 10 });
  await prisma.user.upsert({
    where: { email: "manager@demo.fleet" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "manager@demo.fleet",
      passwordHash: managerPassword,
      name: "Demo Manager",
      role: Role.FLEET_MANAGER,
    },
  });

  console.log("Demo seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
SEED
  success "apps/backend/src/db/seed.ts"
fi

# ── Ensure db:seed script exists in package.json ─────────────────────────────
if [[ -f apps/backend/package.json ]]; then
  if ! grep -q '"db:seed"' apps/backend/package.json; then
    # Keep setup aligned with the backend's expected seed script name.
    sed -i 's/"scripts": {/"scripts": {\n    "db:seed": "bun run src\/db\/seed.ts",/' apps/backend/package.json 2>/dev/null || true
  fi
fi

# ── .gitignore ────────────────────────────────────────────────────────────────
touch .gitignore
for entry in \
  "node_modules/" \
  ".env" \
  "apps/**/.env" \
  "apps/**/.env.*" \
  "!apps/**/.env.example" \
  "*.log" \
  "dist/" \
  ".expo/" \
  "ios/" \
  "android/" \
  "*.orig.*" \
  ".DS_Store" \
  "Thumbs.db"
do
  if ! grep -qxF "$entry" .gitignore; then
    echo "$entry" >> .gitignore
  fi
done
success ".gitignore (updated)"

# ── .dockerignore ─────────────────────────────────────────────────────────────
cat > .dockerignore << 'DOCKERIGNORE'
.git
.github
.turbo
node_modules
**/node_modules
**/dist
**/build
**/.next
**/.expo
**/coverage
.DS_Store
.env
.env.*
README.md
DOCKERIGNORE
success ".dockerignore"

# ══════════════════════════════════════════════════════════════════════════════
#  STEP 8 — DEPLOY
# ══════════════════════════════════════════════════════════════════════════════
header "Ready to deploy!"

echo ""
echo -e "  ${DIM}Configured:${NC}"
echo -e "  ${GREEN}✓${NC} Deploy mode:  ${WHITE}$DEPLOY_MODE${NC}"
echo -e "  ${GREEN}✓${NC} Data mode:    ${WHITE}$DATA_MODE${NC}"
echo -e "  ${GREEN}✓${NC} Host:         ${WHITE}$HOST${NC}"
echo -e "  ${GREEN}✓${NC} Database:     ${WHITE}$DB_MODE${NC}"
echo -e "  ${GREEN}✓${NC} Monitoring:   ${WHITE}$MONITORING${NC}"
echo -e "  ${GREEN}✓${NC} Stripe:       ${WHITE}${STRIPE_MODE}${NC}"
echo ""

if [[ "$STRIPE_ENABLED" != "true" ]]; then
  warn "Stripe is currently disabled. Fleet AI still runs fully (Stripe endpoints stay unavailable)."
  echo -e "  ${DIM}To enable Stripe later, set:${NC}"
  echo -e "    ${WHITE}apps/backend/.env${NC} → STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE"
  echo -e "    ${WHITE}apps/web/.env${NC}     → VITE_STRIPE_PUBLISHABLE_KEY"
elif [[ "$STRIPE_MODE" == "test" ]]; then
  info "Stripe TEST mode enabled. Use test cards (e.g. 4242 4242 4242 4242) in checkout."
fi

if [[ "$AI_PROVIDER" == "ollama" && -z "$OPENAI_API_KEY" ]]; then
  warn "OpenAI key not provided. AI will use Ollama at ${OLLAMA_BASE_URL}."
  echo -e "  ${DIM}If Ollama is not running, start it or add OPENAI_API_KEY in apps/backend/.env.${NC}"
fi

if ! confirm "Deploy now?" "y"; then
  echo ""
  info "Config files written. Run manually:"
  case "$DEPLOY_MODE" in
    local-docker) echo "  docker compose up -d" ;;
    local-native) echo "  cd apps/backend && bun install && bunx prisma migrate deploy && bun dev" ;;
    production)   echo "  docker compose -f docker-compose.prod.yml up -d" ;;
  esac
  exit 0
fi

# ── Run the deployment ────────────────────────────────────────────────────────
deploy() {
  case "$DEPLOY_MODE" in

    # ── local-docker ───────────────────────────────────────────────────────
    local-docker)
      command -v docker &>/dev/null || error "Docker not found. Install from https://docker.com"

      info "Pulling / building images…"
      docker compose pull --ignore-pull-failures 2>/dev/null || true
      docker compose build --parallel

      info "Starting containers…"
      docker compose up -d

      info "Waiting for postgres to be healthy…"
      for i in {1..30}; do
        docker compose exec -T postgres pg_isready -U "${DB_USER:-fleetai}" &>/dev/null && break
        sleep 2; echo -n "."
      done
      echo ""

      info "Ensuring local Docker database credentials match generated config…"
      docker compose exec -T postgres psql -U "${DB_USER:-fleetai}" -d postgres \
        -c "ALTER USER \"${DB_USER:-fleetai}\" WITH PASSWORD '${DB_PASSWORD//\'/\'\'}';" >/dev/null

      info "Running Prisma migrations…"
      MIGRATE_LOG=$(mktemp)
      if ! docker compose exec -T backend bunx prisma migrate deploy 2>&1 | tee "$MIGRATE_LOG"; then
        if grep -q "Error: P3009" "$MIGRATE_LOG"; then
          FAILED_MIGRATION=$(
            docker compose exec -T postgres psql -U "${DB_USER:-fleetai}" -d "${DB_NAME:-fleetai}" -Atqc \
              "SELECT migration_name FROM \"_prisma_migrations\" WHERE finished_at IS NULL AND rolled_back_at IS NULL ORDER BY started_at DESC LIMIT 1;"
          )

          if [[ -n "$FAILED_MIGRATION" ]]; then
            warn "Detected failed migration record: ${FAILED_MIGRATION}. Marking as rolled back and retrying."
            docker compose exec -T backend bunx prisma migrate resolve --rolled-back "$FAILED_MIGRATION"
            docker compose exec -T backend bunx prisma migrate deploy
          else
            rm -f "$MIGRATE_LOG"
            error "Prisma reported P3009, but no failed migration record was found."
          fi
        else
          rm -f "$MIGRATE_LOG"
          error "Prisma migration failed. Check the logs above."
        fi
      fi
      rm -f "$MIGRATE_LOG"

      if [[ "$DATA_MODE" == "demo" ]]; then
        info "Seeding demo data…"
        docker compose exec -T backend bun run db:seed
      fi

      echo ""
      success "Fleet AI is running! 🚀"
      divider
      echo -e "  ${WHITE}Web Dashboard${NC}  →  ${CYAN}${FRONTEND_URL}${NC}"
      echo -e "  ${WHITE}Backend API${NC}    →  ${CYAN}${BACKEND_URL}${NC}"
      echo -e "  ${WHITE}WebSocket${NC}      →  ${CYAN}${WS_URL}/ws${NC}"
      [[ "$MONITORING" == "true" ]] && echo -e "  ${WHITE}Grafana${NC}        →  ${CYAN}http://${HOST}:${GRAFANA_PORT}${NC}"
      divider
      if [[ "$DATA_MODE" == "demo" ]]; then
        echo -e "  ${YELLOW}Demo Credentials:${NC}"
        echo -e "  Manager: ${WHITE}manager@bharatlogistics.in${NC}  /  ${WHITE}Manager@123${NC}"
        echo -e "  Driver:  ${WHITE}driver1@bharatlogistics.in${NC}  /  ${WHITE}Driver@123${NC}"
        divider
      fi
      echo ""
      ;;

    # ── local-native ───────────────────────────────────────────────────────
    local-native)
      command -v bun &>/dev/null || error "Bun not found. Install: curl -fsSL https://bun.sh/install | bash"

      if [[ "$DB_MODE" == "docker" ]]; then
        info "Starting PostgreSQL via Docker…"
        docker compose up -d postgres redis
        sleep 4
      fi

      info "Installing backend dependencies…"
      cd apps/backend && bun install

      info "Running Prisma migrations…"
      bunx prisma migrate deploy
      bunx prisma generate

      if [[ "$DATA_MODE" == "demo" ]]; then
        info "Seeding demo data…"
        bun run db:seed
      fi

      cd ../web && bun install
      cd ../..

      info "Starting backend (background)…"
      cd apps/backend && bun dev &
      BACKEND_PID=$!
      echo "$BACKEND_PID" > /tmp/fleet_backend.pid
      cd ../..

      sleep 3

      info "Starting web (background)…"
      cd apps/web && bun dev --host 0.0.0.0 &
      WEB_PID=$!
      echo "$WEB_PID" > /tmp/fleet_web.pid
      cd ../..

      echo ""
      success "Fleet AI is running! 🚀"
      divider
      echo -e "  ${WHITE}Web Dashboard${NC}  →  ${CYAN}${FRONTEND_URL}${NC}"
      echo -e "  ${WHITE}Backend API${NC}    →  ${CYAN}${BACKEND_URL}${NC}"
      echo -e "  Backend PID: $BACKEND_PID | Web PID: $WEB_PID"
      echo -e "  ${DIM}To stop: kill \$(cat /tmp/fleet_backend.pid) \$(cat /tmp/fleet_web.pid)${NC}"
      divider
      if [[ "$DATA_MODE" == "demo" ]]; then
        echo -e "  ${YELLOW}Demo Credentials:${NC}"
        echo -e "  Manager: ${WHITE}manager@bharatlogistics.in${NC}  /  ${WHITE}Manager@123${NC}"
        echo -e "  Driver:  ${WHITE}driver1@bharatlogistics.in${NC}  /  ${WHITE}Driver@123${NC}"
        divider
      fi
      ;;

    # ── production ─────────────────────────────────────────────────────────
    production)
      command -v docker &>/dev/null || error "Docker not found."

      info "Building production images…"
      docker compose -f docker-compose.prod.yml build --parallel

      info "Starting production stack…"
      docker compose -f docker-compose.prod.yml up -d postgres redis
      sleep 5

      info "Running migrations…"
      docker compose -f docker-compose.prod.yml run --rm backend bunx prisma migrate deploy

      if [[ "$DATA_MODE" == "demo" ]]; then
        info "Seeding demo data…"
        docker compose -f docker-compose.prod.yml run --rm backend bun run db:seed
      fi

      docker compose -f docker-compose.prod.yml up -d

      echo ""
      success "Fleet AI production stack is running! 🚀"
      divider
      echo -e "  ${WHITE}Site${NC}           →  ${CYAN}https://${HOST}${NC}"
      echo -e "  ${WHITE}API${NC}            →  ${CYAN}https://${HOST}/api/v1${NC}"
      [[ "$MONITORING" == "true" ]] && echo -e "  ${WHITE}Grafana${NC}        →  ${CYAN}https://${HOST}/grafana${NC}"
      divider
      warn "SSL: Run this to get a certificate:"
      echo "  docker compose -f docker-compose.prod.yml run --rm certbot certonly --webroot -w /var/www/certbot -d ${HOST} --email admin@${HOST} --agree-tos"
      echo "  Then: docker compose -f docker-compose.prod.yml restart nginx"
      ;;
  esac
}

deploy

echo ""
echo -e "${DIM}Config files are in: config/fleet.config.ts, apps/*/\.env${NC}"
echo -e "${DIM}Re-run setup.sh anytime to reconfigure.${NC}"
echo ""
