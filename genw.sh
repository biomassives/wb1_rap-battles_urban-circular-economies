#!/usr/bin/env bash
# ------------------------------------------------------------
# update-nile-env.sh
# Reads .env, parses LAB_NILEDB_API_URL (or POSTGRES_URL),
# and rewrites the needed POSTGRES_* variables.
# ------------------------------------------------------------

set -euo pipefail

ENV_FILE=".env"

# ----------------------------------------------------------------
# Helper: replace or append a key=value pair while preserving order
# ----------------------------------------------------------------
write_key() {
  local key=$1
  local value=$2
  if grep -qE "^${key}=" "$TMP_FILE"; then
    sed -i -E "s|^${key}=.*|${key}=${value}|g" "$TMP_FILE"
  else
    echo "" >> "$TMP_FILE"
    echo "${key}=${value}" >> "$TMP_FILE"
  fi
}

# ----------------------------------------------------------------
# 1. Load current .env into a temporary file
# ----------------------------------------------------------------
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ $ENV_FILE not found."
  exit 1
fi
TMP_FILE=$(mktemp)
cp "$ENV_FILE" "$TMP_FILE"

# ----------------------------------------------------------------
# 2. Grab the raw connection URL
# ----------------------------------------------------------------
RAW_URL=$(grep -E '^LAB_NILEDB_API_URL=' "$TMP_FILE" | cut -d'=' -f2- || true)

# Fallback to the older name if the lab variable is missing
if [[ -z "$RAW_URL" ]]; then
  RAW_URL=$(grep -E '^POSTGRES_URL=' "$TMP_FILE" | cut -d'=' -f2- || true)
fi

if [[ -z "$RAW_URL" ]]; then
  echo "❌ Neither LAB_NILEDB_API_URL nor POSTGRES_URL found in $ENV_FILE."
  exit 1
fi

# ----------------------------------------------------------------
# 3. Parse the URL (postgres://user:pass@host:port/db?opts)
# ----------------------------------------------------------------
SCHEME_STRIPPED=${RAW_URL#*://}          # remove scheme

USER=${SCHEME_STRIPPED%%:*}
PASS_FROM_URL=${SCHEME_STRIPPED#*:}
PASS_FROM_URL=${PASS_FROM_URL%@*}
HOST=${SCHEME_STRIPPED#*@}
HOST=${HOST%%:*}
DB_WITH_PARAMS=${SCHEME_STRIPPED#*/}     # after first '/'
DATABASE=${DB_WITH_PARAMS%%\?*}          # strip query string

# ----------------------------------------------------------------
# 4. Override password if LAB_NILEDB_PASSWORD exists
# ----------------------------------------------------------------
LAB_PASS=$(grep -E '^LAB_NILEDB_PASSWORD=' "$TMP_FILE" | cut -d'=' -f2- || true)
if [[ -n "$LAB_PASS" ]]; then
  PASSWORD="$LAB_PASS"
else
  PASSWORD="$PASS_FROM_URL"
fi

# ----------------------------------------------------------------
# 5. Build derived URLs
# ----------------------------------------------------------------
PRISMA_URL="postgresql://${USER}:${PASSWORD}@${HOST}:5432/${DATABASE}?sslmode=require&connection_limit=1"
NON_POOLING_URL="${RAW_URL}"   # keep original scheme & query string

# ----------------------------------------------------------------
# 6. Write/replace the POSTGRES_* variables
# ----------------------------------------------------------------
write_key "POSTGRES_PRISMA_URL" "$PRISMA_URL"
write_key "POSTGRES_URL_NON_POOLING" "$NON_POOLING_URL"
write_key "POSTGRES_USER" "$USER"
write_key "POSTGRES_PASSWORD" "$PASSWORD"
write_key "POSTGRES_HOST" "$HOST"
write_key "POSTGRES_DATABASE" "$DATABASE"

# ----------------------------------------------------------------
# 7. Overwrite the original .env
# ----------------------------------------------------------------
mv "$TMP_FILE" "$ENV_FILE"
echo "✅ $ENV_FILE updated with Nile DB variables."

