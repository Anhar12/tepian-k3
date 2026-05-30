#!/bin/sh
set -e

echo "Starting tepian-k3 server..."

# NOTE: Migrations are NOT run here. They run as a separate Coolify
# "Pre-deployment Command" (sh /usr/local/bin/docker-migrate.sh) so a failed
# migration aborts the deploy instead of crash-looping the server.

echo "Starting server..."
exec node /app/apps/server/dist/index.mjs
