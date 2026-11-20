#!/usr/bin/env bash
# Destructive PostgreSQL restore. Redis is transient and is flushed.
# Usage: deploy/restore.sh <postgres-dump> --yes
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$DEPLOY_DIR/deploy/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$DEPLOY_DIR/deploy/docker-compose.prod.yml}"
DUMP_FILE="${1:-}"
CONFIRM="${2:-}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

[ -n "$DUMP_FILE" ] || die "Usage: $0 <postgres-dump> --yes"
[ -f "$DUMP_FILE" ] || die "Dump file not found: $DUMP_FILE"
[ "$CONFIRM" = "--yes" ] || die "This replaces the live database. Re-run with --yes to confirm."
[ -f "$ENV_FILE" ] || die "Missing $ENV_FILE"

echo "Stopping app and worker..."
compose stop app worker caddy

echo "Flushing transient Redis data..."
compose exec -T redis redis-cli FLUSHDB >/dev/null || true

echo "Restoring PostgreSQL from $DUMP_FILE ..."
compose exec -T db sh -c 'pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < "$DUMP_FILE"

echo "Starting stack..."
compose up -d --wait
compose exec -T app node -e "fetch('http://127.0.0.1:3000/health').then(async (r)=>{console.log(await r.text());process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

echo "Restore complete. Review the app and worker logs."
