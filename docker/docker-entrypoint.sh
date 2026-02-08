#!/bin/sh
set -e

echo "Starting tepian-k3 server..."

# Run the server
exec node apps/server/dist/index.mjs
