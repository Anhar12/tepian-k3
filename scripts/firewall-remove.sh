#!/usr/bin/env bash
# =============================================================================
# firewall-remove.sh
# Remove the Tepian K3 firewall rules added by firewall-allow.sh.
#
# Supports:
#   - Linux  → ufw  (run with sudo)
#   - Windows (Git Bash / MSYS2) → netsh advfirewall  (run as Administrator)
#
# Removes rules for:
#   - WEB_PORT      (default 3001) — Nginx / React SPA
#   - SERVER_PORT   (default 3000) — Hono API server
#   - POSTGRES_PORT (default 5433) — PostgreSQL
#
# Usage:
#   Linux:   sudo ./scripts/firewall-remove.sh
#   Windows: run Git Bash as Administrator, then ./scripts/firewall-remove.sh
# =============================================================================

set -euo pipefail

# ---- Detect OS ----
detect_os() {
  local uname
  uname=$(uname -s 2>/dev/null || echo "unknown")
  case "$uname" in
    Linux*)  echo "linux"   ;;
    MINGW*)  echo "windows" ;;
    MSYS*)   echo "windows" ;;
    CYGWIN*) echo "windows" ;;
    *)       echo "unknown" ;;
  esac
}
OS=$(detect_os)

# ---- Load .env.build (if present) ----
ENV_BUILD="$(dirname "$0")/../.env.build"
if [[ -f "$ENV_BUILD" ]]; then
  while IFS='=' read -r key value; do
    key="${key//$'\r'/}"          # strip Windows CRLF
    value="${value//$'\r'/}"
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    value="${value%%#*}"
    value="${value%"${value##*[![:space:]]}"}"
    value="${value#\"}" value="${value%\"}"
    value="${value#\'}" value="${value%\'}"
    [[ -z "${!key+x}" ]] && export "$key=$value"
  done < "$ENV_BUILD"
fi

# ---- Load .env (if present) ----
ENV_FILE="$(dirname "$0")/../.env"
if [[ -f "$ENV_FILE" ]]; then
  while IFS='=' read -r key value; do
    key="${key//$'\r'/}"          # strip Windows CRLF
    value="${value//$'\r'/}"
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    value="${value%%#*}"
    value="${value%"${value##*[![:space:]]}"}"
    value="${value#\"}" value="${value%\"}"
    value="${value#\'}" value="${value%\'}"
    [[ -z "${!key+x}" ]] && export "$key=$value"
  done < "$ENV_FILE"
fi

# ---- Defaults ----
WEB_PORT="${WEB_PORT:-3001}"
SERVER_PORT="${SERVER_PORT:-3000}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"

echo "============================================="
echo " Tepian K3 — Removing Firewall Rules"
echo " Platform: ${OS}"
echo "============================================="
echo ""
echo "  Web frontend  : port ${WEB_PORT}/tcp"
echo "  API server    : port ${SERVER_PORT}/tcp"
echo "  PostgreSQL    : port ${POSTGRES_PORT}/tcp"
echo ""

# =============================================================================
# Linux — ufw
# =============================================================================
if [[ "$OS" == "linux" ]]; then

  if ! command -v ufw &>/dev/null; then
    echo "ERROR: ufw is not installed."
    exit 1
  fi

  if [[ "$EUID" -ne 0 ]]; then
    echo "ERROR: This script must be run as root on Linux (use sudo)."
    exit 1
  fi

  ufw_delete() {
    local port="$1"
    if ufw status | grep -qE "^${port}/tcp"; then
      ufw delete allow "${port}/tcp"
      echo "  Removed rule for port ${port}/tcp"
    else
      echo "  No rule found for port ${port}/tcp — skipping"
    fi
  }

  echo "[1/3] Removing web frontend rule (port ${WEB_PORT}/tcp)..."
  ufw_delete "${WEB_PORT}"

  echo "[2/3] Removing API server rule (port ${SERVER_PORT}/tcp)..."
  ufw_delete "${SERVER_PORT}"

  echo "[3/3] Removing PostgreSQL rule (port ${POSTGRES_PORT}/tcp)..."
  ufw_delete "${POSTGRES_PORT}"

  echo ""
  echo "============================================="
  echo " Current rules:"
  ufw status numbered
  echo "============================================="

# =============================================================================
# Windows — netsh advfirewall
# =============================================================================
elif [[ "$OS" == "windows" ]]; then

  if ! net session &>/dev/null 2>&1; then
    echo "ERROR: This script must be run as Administrator."
    echo "       Right-click Git Bash → 'Run as administrator', then re-run."
    exit 1
  fi

  netsh_delete() {
    local name="$1"
    if netsh advfirewall firewall show rule name="$name" &>/dev/null 2>&1; then
      netsh advfirewall firewall delete rule name="$name"
      echo "  Removed rule: ${name}"
    else
      echo "  No rule found: '${name}' — skipping"
    fi
  }

  echo "[1/3] Removing web frontend rule..."
  netsh_delete "Tepian K3 Web"

  echo "[2/3] Removing API server rule..."
  netsh_delete "Tepian K3 Server"

  echo "[3/3] Removing PostgreSQL rule..."
  netsh_delete "Tepian K3 Postgres"

  echo ""
  echo "============================================="
  echo " Remaining Tepian K3 rules (should be empty):"
  for name in "Tepian K3 Web" "Tepian K3 Server" "Tepian K3 Postgres"; do
    if netsh advfirewall firewall show rule name="$name" &>/dev/null 2>&1; then
      echo "  [!] Still present: $name"
    else
      echo "  [ok] Removed: $name"
    fi
  done
  echo "============================================="

else
  echo "ERROR: Unsupported OS '$(uname -s)'. Only Linux and Windows (Git Bash) are supported."
  exit 1
fi

echo ""
echo "Done."
