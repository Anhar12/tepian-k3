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
echo "[1/4] Logging in to ghcr.io..."
echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
echo ""

# ---- Build server ----
echo "[2/4] Building server image..."
docker build \
  --platform linux/amd64 \
  -t "${SERVER_IMAGE}" \
  .
echo ""

# ---- Build web ----
echo "[3/4] Building web image (VITE_SERVER_URL=${VITE_SERVER_URL})..."
docker build \
  --platform linux/amd64 \
  -f Dockerfile.web \
  --build-arg VITE_SERVER_URL="${VITE_SERVER_URL}" \
  -t "${WEB_IMAGE}" \
  .
echo ""

# ---- Push ----
echo "[4/4] Pushing images to GHCR..."
docker push "${SERVER_IMAGE}"
docker push "${WEB_IMAGE}"
echo ""

echo "============================================="
echo " Done! Images pushed:"
echo "   ${SERVER_IMAGE}"
echo "   ${WEB_IMAGE}"
echo ""
echo " Next: copy docker-compose.prod.yml + .env"
echo " to the office laptop, then run:"
echo "   ./scripts/deploy-laptop.sh"
echo "============================================="
