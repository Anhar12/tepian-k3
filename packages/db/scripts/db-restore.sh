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

if [ -z "${1:-}" ]; then
  echo "Available snapshots:"
  ls -1 "$SNAPSHOTS_DIR"/*.sql 2>/dev/null | while read -r f; do
    basename "$f" .sql
  done
  echo ""
  echo "Usage: pnpm db:restore <snapshot_name>"
  exit 1
fi

SNAPSHOT_FILE="$SNAPSHOTS_DIR/${1}.sql"

if [ ! -f "$SNAPSHOT_FILE" ]; then
  echo "Error: Snapshot not found: $SNAPSHOT_FILE"
  exit 1
fi

# Extract DB name from URL for drop/create
DB_NAME=$(echo "$POSTGRES_URL" | sed -E 's|.*/([^?]+).*|\1|')
BASE_URL=$(echo "$POSTGRES_URL" | sed -E 's|/[^/]*$|/postgres|')

echo "Restoring database from: $SNAPSHOT_FILE"
echo "WARNING: This will drop and recreate the database '$DB_NAME'."
read -rp "Continue? [y/N] " confirm
if [[ "$confirm" != [yY] ]]; then
  echo "Aborted."
  exit 0
fi

psql "$BASE_URL" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
psql "$BASE_URL" -c "CREATE DATABASE \"$DB_NAME\";"
psql "$POSTGRES_URL" < "$SNAPSHOT_FILE"
echo "Database restored from $SNAPSHOT_FILE"
