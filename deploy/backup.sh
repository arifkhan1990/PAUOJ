#!/usr/bin/env bash
# PostgreSQL + Redis backup. Safe to run from cron. Postgres is the source of truth.
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$DEPLOY_DIR/deploy/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$DEPLOY_DIR/deploy/docker-compose.prod.yml}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/pauoj}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

[ -f "$ENV_FILE" ] || die "Missing $ENV_FILE"
mkdir -p "$BACKUP_DIR/postgres" "$BACKUP_DIR/redis"
chmod 700 "$BACKUP_DIR" "$BACKUP_DIR/postgres" "$BACKUP_DIR/redis"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
PG_FILE="$BACKUP_DIR/postgres/pauoj-$STAMP.dump"
REDIS_FILE="$BACKUP_DIR/redis/redis-$STAMP.rdb"

echo "Backing up PostgreSQL..."
compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$PG_FILE"
[ -s "$PG_FILE" ] || die "PostgreSQL dump is empty."
compose exec -T db pg_restore --list < "$PG_FILE" >/dev/null
chmod 600 "$PG_FILE"

echo "Backing up Redis..."
if compose exec -T redis redis-cli SAVE >/dev/null; then
  REDIS_CONTAINER="$(compose ps -q redis)"
  if [ -n "$REDIS_CONTAINER" ]; then
    docker cp "$REDIS_CONTAINER:/data/dump.rdb" "$REDIS_FILE" >/dev/null
    chmod 600 "$REDIS_FILE"
  else
    echo "WARNING: Redis container not found; skipping Redis dump." >&2
  fi
else
  echo "WARNING: Redis SAVE failed; skipping Redis dump." >&2
fi

find "$BACKUP_DIR/postgres" -type f -name '*.dump' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR/redis" -type f -name '*.rdb' -mtime +"$RETENTION_DAYS" -delete

echo "Backup complete:"
ls -lh "$PG_FILE"
[ -f "$REDIS_FILE" ] && ls -lh "$REDIS_FILE"
