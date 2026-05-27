#!/bin/sh
set -e

echo "Starting tepian-k3 server..."


if [ -n "$POSTGRES_URL" ]; then
  echo "Running database migrations..."
  cd /app/packages/db
  node /app/node_modules/.bin/drizzle-kit migrate --config=/app/packages/db/drizzle.config.ts
  cd /app
  echo "Migrations complete."
else
  echo "WARN: POSTGRES_URL not set, skipping migrations."
fi

echo "Starting server..."
exec node /app/apps/server/dist/index.mjs
