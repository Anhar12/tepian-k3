#!/bin/sh
set -e

echo "Starting tepian-k3 server..."


cd /app/packages/db
cd /app

echo "Starting server..."
exec node apps/server/dist/index.mjs
