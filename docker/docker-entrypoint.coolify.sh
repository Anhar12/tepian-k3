#!/bin/sh
set -e

echo "Starting tepian-k3 server..."

# Run migrations (idempotent — only applies pending migrations)
echo "Running database migrations..."
MIGRATE_MAX_ATTEMPTS="${MIGRATE_MAX_ATTEMPTS:-20}"
MIGRATE_RETRY_DELAY="${MIGRATE_RETRY_DELAY:-3}"
attempt=1

cd /app/packages/db
while [ "$attempt" -le "$MIGRATE_MAX_ATTEMPTS" ]; do
  if /app/node_modules/.bin/drizzle-kit migrate; then
    echo "Migrations complete."
    break
  fi

  if [ "$attempt" -eq "$MIGRATE_MAX_ATTEMPTS" ]; then
    echo "Migration failed after $MIGRATE_MAX_ATTEMPTS attempts."
    exit 1
  fi

  echo "Migration attempt $attempt failed. Retrying in ${MIGRATE_RETRY_DELAY}s..."
  attempt=$((attempt + 1))
  sleep "$MIGRATE_RETRY_DELAY"
done
cd /app

echo "Starting server..."
exec node dist/index.mjs
