#!/usr/bin/env bash
# Save as generate-nile-env.sh and run: source ./generate-nile-env.sh

NILE_URL="${POSTGRES_URL:-postgres://myuser:mySecretPass@my-db.nile.dev:5432/mydb?sslmode=require}"

# Parse with Bash parameter expansion
USER="${NILE_URL#postgres://}"
USER="${USER%%:*}"
PASS="${NILE_URL#*${USER}:}"
PASS="${PASS%%@*}"
HOST="${NILE_URL#*@}"
HOST="${HOST%%:*}"
DB="${NILE_URL##*/}"
DB="${DB%%\?*}"

export POSTGRES_USER="${USER}"
export POSTGRES_PASSWORD="${PASS}"
export POSTGRES_HOST="${HOST}"
export POSTGRES_DATABASE="${DB}"
export POSTGRES_PRISMA_URL="postgresql://${USER}:${PASS}@${HOST}:5432/${DB}?sslmode=require&connection_limit=1"
export POSTGRES_URL_NON_POOLING="${NILE_URL}"

