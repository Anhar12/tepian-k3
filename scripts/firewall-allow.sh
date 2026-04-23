#!/usr/bin/env bash
# =============================================================================
# firewall-allow.sh
# Open firewall rules for Tepian K3 services.
#
# Supports:
#   - Linux  → ufw  (run with sudo)
#   - Windows (Git Bash / MSYS2) → netsh advfirewall  (run as Administrator)
#
# Opens:
#   - WEB_PORT      (default 3001) — Nginx / React SPA
#   - SERVER_PORT   (default 3000) — Hono API server (split-compose only)
#   - POSTGRES_PORT (default 5433) — PostgreSQL
#
# Usage:
#   Linux:   sudo ./scripts/firewall-allow.sh
#   Windows: run Git Bash as Administrator, then ./scripts/firewall-allow.sh
#
# Port overrides (env var or .env / .env.build):
#   WEB_PORT=8080 sudo ./scripts/firewall-allow.sh
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
echo " Tepian K3 — Opening Firewall Rules"
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
    echo "ERROR: ufw is not installed. Run: sudo apt install ufw"
    exit 1
  fi

  if [[ "$EUID" -ne 0 ]]; then
    echo "ERROR: This script must be run as root on Linux (use sudo)."
    exit 1
  fi

  # Enable ufw if inactive
  if ufw status | grep -q "inactive"; then
    echo "[!] ufw is inactive — enabling with default-deny..."
    ufw --force enable
    echo ""
  fi

  echo "[1/3] Allowing web frontend (port ${WEB_PORT}/tcp)..."
  ufw allow "${WEB_PORT}/tcp" comment "tepian-k3-web"

  echo "[2/3] Allowing API server (port ${SERVER_PORT}/tcp)..."
  ufw allow "${SERVER_PORT}/tcp" comment "tepian-k3-server"

  echo "[3/3] Allowing PostgreSQL (port ${POSTGRES_PORT}/tcp)..."
  ufw allow "${POSTGRES_PORT}/tcp" comment "tepian-k3-postgres"

  echo ""
  echo "============================================="
  echo " Current rules:"
  ufw status numbered
  echo "============================================="

# =============================================================================
# Windows — netsh advfirewall
# =============================================================================
elif [[ "$OS" == "windows" ]]; then

  # Check for Administrator privileges
  if ! net session &>/dev/null 2>&1; then
    echo "ERROR: This script must be run as Administrator."
    echo "       Right-click Git Bash → 'Run as administrator', then re-run."
    exit 1
  fi

  add_rule() {
    local name="$1"
    local port="$2"
    # Remove any existing rule with the same name first to stay idempotent
    netsh advfirewall firewall delete rule name="$name" &>/dev/null || true
    netsh advfirewall firewall add rule \
      name="$name" \
      dir=in \
      action=allow \
      protocol=tcp \
      localport="$port"
  }

  echo "[1/3] Allowing web frontend (port ${WEB_PORT}/tcp)..."
  add_rule "Tepian K3 Web" "${WEB_PORT}"

  echo "[2/3] Allowing API server (port ${SERVER_PORT}/tcp)..."
  add_rule "Tepian K3 Server" "${SERVER_PORT}"

  echo "[3/3] Allowing PostgreSQL (port ${POSTGRES_PORT}/tcp)..."
  add_rule "Tepian K3 Postgres" "${POSTGRES_PORT}"

  echo ""
  echo "============================================="
  echo " Current Tepian K3 rules:"
  netsh advfirewall firewall show rule name="Tepian K3 Web"     2>/dev/null || true
  netsh advfirewall firewall show rule name="Tepian K3 Server"  2>/dev/null || true
  netsh advfirewall firewall show rule name="Tepian K3 Postgres" 2>/dev/null || true
  echo "============================================="

else
  echo "ERROR: Unsupported OS '$(uname -s)'. Only Linux and Windows (Git Bash) are supported."
  exit 1
fi

echo ""
echo "Done. To remove these rules run:"
if [[ "$OS" == "linux" ]]; then
  echo "  sudo ./scripts/firewall-remove.sh"
else
  echo "  ./scripts/firewall-remove.sh  (as Administrator)"
fi
