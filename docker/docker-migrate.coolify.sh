#!/bin/sh
# Standalone migration runner for Coolify.
#
# Run this as the Coolify "Pre-deployment Command" so migrations execute in a
# one-off container BEFORE the new server container starts. If a migration
# fails, the deploy aborts and the previous server keeps running, instead of
# crash-looping a server against a half-migrated database.
#
# Coolify pre-deployment command:
#   sh /usr/local/bin/docker-migrate.sh
set -e

if [ -z "$POSTGRES_URL" ]; then
  echo "ERROR: POSTGRES_URL not set, cannot run migrations." >&2
  exit 1
fi

echo "Running database migrations..."
/app/packages/db/node_modules/.bin/drizzle-kit migrate --config=/app/packages/db/drizzle.config.ts
echo "Migrations complete."
