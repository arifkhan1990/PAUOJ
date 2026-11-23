#!/usr/bin/env bash
# Verified PostgreSQL dump for the srv-managed PAU OJ host.
# Usage: PREFIX=pre-0.8.1 bash deploy/backup-srv.sh
set -euo pipefail
umask 077

PREFIX="${PREFIX:-auto}"
BACKUP_DIR="${BACKUP_DIR:-/home/naba/server/projects/pauoj/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DB_CONTAINER="${DB_CONTAINER:-srv-pauoj-db}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/$PREFIX-$STAMP.dump"

mkdir -p "$BACKUP_DIR"
docker exec "$DB_CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$OUT"
[ -s "$OUT" ] || { echo "ERROR: dump is empty" >&2; rm -f "$OUT"; exit 1; }
docker exec -i "$DB_CONTAINER" pg_restore --list < "$OUT" > /dev/null
chmod 600 "$OUT"

find "$BACKUP_DIR" -maxdepth 1 -name '*.dump' -mtime +"$RETENTION_DAYS" -delete

echo "Backup written and verified: $OUT ($(du -h "$OUT" | cut -f1))"
