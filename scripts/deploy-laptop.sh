#!/usr/bin/env bash
# =============================================================================
# deploy-laptop.sh
# Pull images from GHCR and run all services on the office laptop.
# Run this script ON the office laptop.
#
# Usage:
#   ./deploy-laptop.sh                  # prod stack only
#   ./deploy-laptop.sh --tunnel         # prod stack + Cloudflare named tunnel
#   ./deploy-laptop.sh --tunnel-quick   # prod stack + Cloudflare quick tunnel
#
# Required env vars (or edit defaults below):
#   GHCR_USER              - your GitHub username
#   GHCR_TOKEN             - GitHub PAT with read:packages scope (read-only is enough)
#   CLOUDFLARE_TUNNEL_TOKEN - required only when using --tunnel
# =============================================================================

set -euo pipefail

# ---- Parse args ----
TUNNEL_PROFILE=""
for arg in "$@"; do
  case "$arg" in
    --tunnel)       TUNNEL_PROFILE="tunnel" ;;
    --tunnel-quick) TUNNEL_PROFILE="tunnel-quick" ;;
  esac
done

# ---- Helper: load a .env file (skips vars already set in shell) ----
load_env_file() {
  local file="$1"
  echo "Loading $file..."
  while IFS= read -r line; do
    key="${line%%=*}"
    value="${line#*=}"
    key="${key//$'\r'/}"
    value="${value//$'\r'/}"
    key="${key#"${key%%[![:space:]]*}"}"   # trim leading whitespace
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    value="${value%%#*}"
    value="${value%"${value##*[![:space:]]}"}"
    value="${value#\"}" value="${value%\"}"
    value="${value#\'}" value="${value%\'}"
    # Sanitize: show first 4 and last 4 chars for secrets, full value otherwise
    if [[ ${#value} -gt 12 ]]; then
      sanitized="${value:0:4}...${value: -4}"
    elif [[ -n "$value" ]]; then
      sanitized="(set, ${#value} chars)"
    else
      sanitized="(empty)"
    fi
    if [[ -z "${!key+x}" ]]; then
      export "$key=$value"
      echo "  [loaded] $key = $sanitized"
    else
      echo "  [skip]   $key already set in shell"
    fi
  done < "$file"
}

# ---- Load .env then .env.build (later file fills in missing vars) ----
ROOT_DIR="$(dirname "$0")/.."
[[ -f "$ROOT_DIR/.env" ]]       && load_env_file "$ROOT_DIR/.env"
[[ -f "$ROOT_DIR/.env.build" ]] && load_env_file "$ROOT_DIR/.env.build"

# ---- Config ----
GHCR_USER="${GHCR_USER:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
CLOUDFLARE_COMPOSE="docker-compose.cloudflared.yml"

# ---- Build compose args ----
COMPOSE_ARGS="-f ${COMPOSE_FILE}"
PROFILE_ARGS=""
if [[ -n "$TUNNEL_PROFILE" ]]; then
  if [[ ! -f "$CLOUDFLARE_COMPOSE" ]]; then
    echo "ERROR: $CLOUDFLARE_COMPOSE not found."
    exit 1
  fi
  COMPOSE_ARGS="${COMPOSE_ARGS} -f ${CLOUDFLARE_COMPOSE}"
  PROFILE_ARGS="--profile ${TUNNEL_PROFILE}"
fi

# ---- Validate ----
if [[ -z "$GHCR_USER" ]]; then
  echo "ERROR: GHCR_USER is required (your GitHub username)"
  exit 1
fi
if [[ -z "$GHCR_TOKEN" ]]; then
  echo "ERROR: GHCR_TOKEN is required (GitHub PAT with read:packages)"
  exit 1
fi
if [[ -n "$TUNNEL_PROFILE" && "$TUNNEL_PROFILE" == "tunnel" ]]; then
  if [[ -z "${CLOUDFLARE_TUNNEL_TOKEN:-}" ]]; then
    echo "ERROR: CLOUDFLARE_TUNNEL_TOKEN is required when using --tunnel"
    exit 1
  fi
fi
if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERROR: $COMPOSE_FILE not found."
  exit 1
fi
if [[ ! -f ".env" ]]; then
  echo "ERROR: .env not found. Copy it from the desktop first."
  exit 1
fi

echo "============================================="
echo " Tepian K3 — Deploy on Office Laptop"
[[ -n "$TUNNEL_PROFILE" ]] && echo " Tunnel: ${TUNNEL_PROFILE}"
echo "============================================="
echo ""

# ---- Login ----
echo "[1/4] Logging in to ghcr.io..."
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
echo ""

# ---- Pull latest images ----
echo "[2/4] Pulling images from GHCR..."
docker compose ${COMPOSE_ARGS} pull
echo ""

# ---- Stop old containers (if running) ----
echo "[3/4] Stopping old containers..."
docker compose ${COMPOSE_ARGS} down --remove-orphans
echo ""

# ---- Ensure shared network exists (required when cloudflared compose declares it external) ----
if [[ -n "$TUNNEL_PROFILE" ]]; then
  NETWORK_NAME="tepian-k3_tepian-network"
  if ! docker network inspect "$NETWORK_NAME" &>/dev/null; then
    echo "Creating external network $NETWORK_NAME..."
    docker network create "$NETWORK_NAME"
  fi
fi

# ---- Start ----
echo "[4/4] Starting all services..."
docker compose ${COMPOSE_ARGS} ${PROFILE_ARGS} up -d
echo ""

# ---- Status ----
echo "============================================="
echo " Services status:"
docker compose ${COMPOSE_ARGS} ${PROFILE_ARGS} ps
echo ""
echo " App is running at:"

LAPTOP_IP=$(grep -E '^LAPTOP_IP=' .env 2>/dev/null | cut -d= -f2 || echo "YOUR_LAPTOP_IP")
WEB_PORT=$(grep -E '^WEB_PORT=' .env 2>/dev/null | cut -d= -f2 || echo "3001")

echo "   http://${LAPTOP_IP:-localhost}:${WEB_PORT:-3001}"
[[ "$TUNNEL_PROFILE" == "tunnel-quick" ]] && echo "   Quick tunnel URL: check logs with 'docker compose ${COMPOSE_ARGS} logs cloudflared-quick'"
echo "============================================="
