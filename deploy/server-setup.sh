#!/usr/bin/env bash
# One-time host preparation for the production Compose stack.
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Run as root: sudo bash deploy/server-setup.sh" >&2; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"

command -v docker >/dev/null 2>&1 || {
  echo "Docker is not installed. Install Docker Engine 27+ and the Compose plugin first." >&2
  exit 1
}
docker compose version >/dev/null 2>&1 || {
  echo "Docker Compose plugin is not installed." >&2
  exit 1
}

docker info >/dev/null 2>&1 || {
  echo "Docker daemon is not running or the current shell cannot access it." >&2
  exit 1
}

if command -v apt-get >/dev/null 2>&1; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl git >/dev/null
fi

echo "Creating directories..."
install -d -m 700 -o root -g root /var/lib/pauoj/judge
install -d -m 700 -o root -g root "${BACKUP_DIR:-/var/backups/pauoj}"

if [ ! -f "$DEPLOY_DIR/deploy/.env" ]; then
  cp "$DEPLOY_DIR/deploy/.env.example" "$DEPLOY_DIR/deploy/.env"
  chmod 600 "$DEPLOY_DIR/deploy/.env"
  echo "Created $DEPLOY_DIR/deploy/.env from the example. Edit it before deploying."
fi

chmod +x "$DEPLOY_DIR"/deploy/*.sh

if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp >/dev/null || true
  ufw allow 443/tcp >/dev/null || true
  ufw allow 443/udp >/dev/null || true
  echo "Opened 80/tcp and 443/tcp+udp in ufw (if ufw is enabled)."
fi

cat > /etc/cron.d/pauoj <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 2 * * * root DEPLOY_DIR=$DEPLOY_DIR BACKUP_DIR=${BACKUP_DIR:-/var/backups/pauoj} $DEPLOY_DIR/deploy/backup.sh >> /var/log/pauoj-backup.log 2>&1
*/5 * * * * root HEALTH_URL=http://127.0.0.1:3000/health $DEPLOY_DIR/deploy/healthcheck.sh >> /var/log/pauoj-health.log 2>&1
EOF
chmod 644 /etc/cron.d/pauoj

echo
echo "Host preparation complete."
echo "Next: edit $DEPLOY_DIR/deploy/.env, point DNS at this server, then run:"
echo "  cd $DEPLOY_DIR && bash deploy/deploy.sh"
echo "Seed once with:"
echo "  docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml --profile seed run --rm seed"
