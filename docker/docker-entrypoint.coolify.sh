#!/bin/sh
set -e

echo "Starting tepian-k3 server..."

# Run migrations (idempotent — only applies pending migrations)
echo "Running database migrations..."
cd /app/packages/db && npx drizzle-kit migrate
cd /app

echo "Migrations complete. Starting server..."
exec node dist/index.mjs
