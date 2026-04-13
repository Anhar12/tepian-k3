#!/usr/bin/env bash
# =============================================================================
# build-and-push.sh
# Build Docker images on this machine and push to GHCR.
#
# Usage:
#   ./scripts/build-and-push.sh
#
# Required env vars (or edit defaults below):
#   GHCR_USER      - your GitHub username
#   GHCR_TOKEN     - GitHub PAT with write:packages scope
#   LAPTOP_IP      - LAN IP of the office laptop (baked into web image)
#   IMAGE_TAG      - image tag, defaults to "latest"
# =============================================================================

set -euo pipefail

# ---- Load .env.build for any var not already set in the shell ----
ENV_FILE="$(dirname "$0")/../.env.build"
if [[ -f "$ENV_FILE" ]]; then
  echo "Loading $ENV_FILE..."
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    # Strip inline comments and surrounding quotes from value
    value="${value%%#*}"
    value="${value%"${value##*[![:space:]]}"}"
    value="${value#\"}" value="${value%\"}"
    value="${value#\'}" value="${value%\'}"
    # Only export if not already set in the environment
    if [[ -z "${!key+x}" ]]; then
      export "$key=$value"
    fi
  done < "$ENV_FILE"
fi

# ---- Config (edit these or export as env vars before running) ----
GHCR_USER="${GHCR_USER:-}"
GHCR_TOKEN="${GHCR_TOKEN:-}"
LAPTOP_IP="${LAPTOP_IP:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
WEB_PORT="${WEB_PORT:-3001}"

# ---- Validate ----
if [[ -z "$GHCR_USER" ]]; then
  echo "ERROR: GHCR_USER is required (your GitHub username)"
  exit 1
fi
if [[ -z "$GHCR_TOKEN" ]]; then
  echo "ERROR: GHCR_TOKEN is required (GitHub PAT with write:packages)"
  exit 1
fi
if [[ -z "$LAPTOP_IP" ]]; then
  echo "ERROR: LAPTOP_IP is required (LAN IP of the office laptop, e.g. 192.168.1.100)"
  exit 1
fi

REGISTRY="ghcr.io/${GHCR_USER}"
SERVER_IMAGE="${REGISTRY}/tepian-k3-server:${IMAGE_TAG}"
MIGRATE_IMAGE="${REGISTRY}/tepian-k3-migrate:${IMAGE_TAG}"
WEB_IMAGE="${REGISTRY}/tepian-k3-web:${IMAGE_TAG}"
VITE_SERVER_URL="http://${LAPTOP_IP}:${WEB_PORT}"

echo "============================================="
echo " Tepian K3 — Build & Push to GHCR"
echo "============================================="
echo " Registry  : ${REGISTRY}"
echo " Laptop IP : ${LAPTOP_IP}"
echo " Web URL   : ${VITE_SERVER_URL}"
echo " Tag       : ${IMAGE_TAG}"
echo "============================================="
echo ""

# ---- Login ----
echo "[1/5] Logging in to ghcr.io..."
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
echo ""

# ---- Build server ----
echo "[2/5] Building server image..."
docker build \
  --platform linux/amd64 \
  -t "${SERVER_IMAGE}" \
  .
echo ""

# ---- Build migrate (build stage — has drizzle-kit + all devDeps) ----
echo "[3/5] Building migrate image..."
docker build \
  --platform linux/amd64 \
  --target build \
  -t "${MIGRATE_IMAGE}" \
  .
echo ""

# ---- Build web ----
echo "[4/5] Building web image (VITE_SERVER_URL=${VITE_SERVER_URL})..."
docker build \
  --platform linux/amd64 \
  -f Dockerfile.web \
  --build-arg VITE_SERVER_URL="${VITE_SERVER_URL}" \
  -t "${WEB_IMAGE}" \
  .
echo ""

# ---- Push ----
echo "[5/5] Pushing images to GHCR..."
docker push "${SERVER_IMAGE}"
docker push "${MIGRATE_IMAGE}"
docker push "${WEB_IMAGE}"
echo ""

echo "============================================="
echo " Done! Images pushed:"
echo "   ${SERVER_IMAGE}"
echo "   ${MIGRATE_IMAGE}"
echo "   ${WEB_IMAGE}"
echo ""
echo " Next: copy docker-compose.prod.yml + .env"
echo " to the office laptop, then run:"
echo "   ./scripts/deploy-laptop.sh"
echo "============================================="
