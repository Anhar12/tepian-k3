#!/usr/bin/env bash
set -euo pipefail

# Load POSTGRES_URL from root .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/../../.."
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

POSTGRES_URL=$(grep -E '^POSTGRES_URL=' "$ENV_FILE" | cut -d '=' -f2-)

if [ -z "$POSTGRES_URL" ]; then
  echo "Error: POSTGRES_URL not found in .env"
  exit 1
fi

SNAPSHOTS_DIR="$SCRIPT_DIR/../snapshots"
mkdir -p "$SNAPSHOTS_DIR"

SNAPSHOT_NAME="${1:-snapshot_$(date +%Y%m%d_%H%M%S)}"
SNAPSHOT_FILE="$SNAPSHOTS_DIR/${SNAPSHOT_NAME}.sql"

echo "Creating database snapshot: $SNAPSHOT_FILE"
pg_dump "$POSTGRES_URL" --no-owner --no-acl > "$SNAPSHOT_FILE"
echo "Snapshot saved to $SNAPSHOT_FILE"
