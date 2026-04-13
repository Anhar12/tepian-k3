#!/usr/bin/env bash
# =============================================================================
# deploy-laptop.sh
# Pull images from GHCR and run all services on the office laptop.
# Run this script ON the office laptop.
#
# Usage:
#   ./deploy-laptop.sh
#
# Required env vars (or edit defaults below):
#   GHCR_USER   - your GitHub username
#   GHCR_TOKEN  - GitHub PAT with read:packages scope (read-only is enough)
# =============================================================================

set -euo pipefail

# ---- Config ----
GHCR_USER="${GHCR_USER:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

# ---- Validate ----
if [[ -z "$GHCR_USER" ]]; then
  echo "ERROR: GHCR_USER is required (your GitHub username)"
  exit 1
fi
if [[ -z "$GHCR_TOKEN" ]]; then
  echo "ERROR: GHCR_TOKEN is required (GitHub PAT with read:packages)"
  exit 1
fi
if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERROR: $COMPOSE_FILE not found. Copy it from the desktop first."
  exit 1
fi
if [[ ! -f ".env" ]]; then
  echo "ERROR: .env not found. Copy it from the desktop first."
  exit 1
fi

echo "============================================="
echo " Tepian K3 — Deploy on Office Laptop"
echo "============================================="
echo ""

# ---- Login ----
echo "[1/4] Logging in to ghcr.io..."
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
echo ""

# ---- Pull latest images ----
echo "[2/4] Pulling images from GHCR..."
docker compose -f "${COMPOSE_FILE}" pull
echo ""

# ---- Stop old containers (if running) ----
echo "[3/4] Stopping old containers..."
docker compose -f "${COMPOSE_FILE}" down --remove-orphans
echo ""

# ---- Start ----
echo "[4/4] Starting all services..."
docker compose -f "${COMPOSE_FILE}" up -d
echo ""

# ---- Status ----
echo "============================================="
echo " Services status:"
docker compose -f "${COMPOSE_FILE}" ps
echo ""
echo " App is running at:"

# Extract LAPTOP_IP from CORS_ORIGIN in the compose file or .env
LAPTOP_IP=$(grep -E '^LAPTOP_IP=' .env 2>/dev/null | cut -d= -f2 || echo "YOUR_LAPTOP_IP")
WEB_PORT=$(grep -E '^WEB_PORT=' .env 2>/dev/null | cut -d= -f2 || echo "3001")

echo "   http://${LAPTOP_IP:-localhost}:${WEB_PORT:-3001}"
echo "============================================="
