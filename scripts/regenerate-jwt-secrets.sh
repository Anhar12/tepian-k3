#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

# JWT secret keys to regenerate (excludes expiry/non-secret values)
KEYS=(
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "JWT_RESET_PASSWORD_SECRET"
  "JWT_DOCUMENT_SECRET"
  "JWT_LEGAL_DOCUMENT_SECRET"
  "JWT_TESTING_DOCUMENT_SECRET"
  "JWT_COMPANY_DOCUMENT_SECRET"
)

generate_secret() {
  openssl rand -base64 48 | tr -d '\n'
}

echo "Regenerating JWT secrets in $ENV_FILE..."

for key in "${KEYS[@]}"; do
  if grep -q "^${key}=" "$ENV_FILE"; then
    new_secret=$(generate_secret)
    sed -i "s|^${key}=.*|${key}=${new_secret}|" "$ENV_FILE"
    echo "  Updated: $key"
  else
    echo "  Skipped: $key (not found)"
  fi
done

echo "Done. All JWT secrets have been regenerated."
