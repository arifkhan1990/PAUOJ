#!/usr/bin/env bash
# Deploy PAU OJ next to an existing app on a shared host.
#
# Shape:
# - PAU OJ app on 127.0.0.1:${APP_PORT:-8081} (not :3000)
# - no PAU OJ Caddy; the existing Caddy/Cloudflare Tunnel fronts it
# - the app joins the external ${EDGE_NETWORK:-srv-edge} network as `pauoj-app`
# - the existing reverse proxy gets one host block for ${APP_HOST}
# - no sudo, no changes to the other product's containers/volumes
#
# Run on the server from the repository:
#   cd /home/naba/server/pauoj/app
#   git pull --ff-only
#   bash deploy/deploy-shared.sh
#
# The first run prompts for the SMTP password and writes deploy/.env below the
# app directory with mode 600. It never prints secrets.

set -euo pipefail

APP_DIR="${APP_DIR:-/home/naba/server/pauoj}"
REPO_DIR="${REPO_DIR:-$APP_DIR/app}"
ENV_FILE="${ENV_FILE:-$APP_DIR/deploy/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_DIR/deploy/docker-compose.shared.yml}"
APP_HOST="${APP_HOST:-pauoj.nabasolution.tech}"
APP_PORT="${APP_PORT:-8081}"
EDGE_NETWORK="${EDGE_NETWORK:-srv-edge}"
CADDY_SITES_DIR="${CADDY_SITES_DIR:-/home/naba/server/core/caddy/sites}"
CADDY_CONTAINER="${CADDY_CONTAINER:-srv-caddy}"
CADDY_CONFIG="${CADDY_CONFIG:-/etc/caddy/Caddyfile}"
SMTP_HOST_VALUE="${SMTP_HOST_VALUE:-smtp.hostinger.com}"
SMTP_PORT_VALUE="${SMTP_PORT_VALUE:-465}"
SMTP_USER_VALUE="${SMTP_USER_VALUE:-pauoj@nabasolution.tech}"
ADMIN_EMAIL_VALUE="${ADMIN_EMAIL_VALUE:-pauoj@nabasolution.tech}"
BUILD_SWIFT="${BUILD_SWIFT:-1}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required"
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" -p pauoj "$@"
}

random_hex() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$1"
  else
    head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'
  fi
}

wait_for_health() {
  local attempts="${1:-60}" body
  for _ in $(seq 1 "$attempts"); do
    body="$(curl -fsS --max-time 5 "http://127.0.0.1:${APP_PORT}/health" 2>/dev/null || true)"
    if echo "$body" | grep -q '"status":"ok"' &&
       echo "$body" | grep -qE '"workers":[1-9][0-9]*'; then
      echo "$body"
      return 0
    fi
    sleep 2
  done
  return 1
}

# ---------------------------------------------------------------- preflight
need docker
need git
need curl
docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is missing"
docker network inspect "$EDGE_NETWORK" >/dev/null 2>&1 ||
  die "External network '$EDGE_NETWORK' not found; set EDGE_NETWORK to the proxy network"
ss -ltn 2>/dev/null | grep -q ":${APP_PORT} " &&
  die "Port ${APP_PORT} is already in use; set APP_PORT to a free port"
docker ps --format '{{.Names}}' | grep -qx 'pauoj-app' &&
  echo "WARNING: a container named pauoj-app already exists; it will be recreated"

mkdir -p "$APP_DIR"
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Cloning PAU OJ into $REPO_DIR..."
  git clone https://github.com/arifkhan1990/PAUOJ.git "$REPO_DIR"
elif [ "$SKIP_GIT_PULL" != "1" ]; then
  echo "Updating $REPO_DIR..."
  git -C "$REPO_DIR" pull --ff-only
fi
[ -f "$COMPOSE_FILE" ] || die "Missing $COMPOSE_FILE"
mkdir -p "$APP_DIR/judge" "$APP_DIR/backups"
chmod 700 "$APP_DIR/judge" "$APP_DIR/backups"

# ---------------------------------------------------------------- env file
if [ ! -f "$ENV_FILE" ]; then
  echo "First deploy: creating $ENV_FILE (mode 600)."
  mkdir -p "$(dirname "$ENV_FILE")"
  chmod 700 "$(dirname "$ENV_FILE")"
  SMTP_PASSWORD_VALUE="${SMTP_PASSWORD:-}"
  if [ -z "$SMTP_PASSWORD_VALUE" ]; then
    read -rsp "SMTP password for ${SMTP_USER_VALUE} (blank = link-only): " SMTP_PASSWORD_VALUE
    echo
  fi
  POSTGRES_PASSWORD_VALUE="$(random_hex 24)"
  ADMIN_PASSWORD_VALUE="$(random_hex 24)"
  umask 077
  {
    echo "APP_DOMAIN=${APP_HOST}"
    echo "APP_URL=https://${APP_HOST}"
    echo "APP_PORT=${APP_PORT}"
    echo "POSTGRES_DB=pauoj"
    echo "POSTGRES_USER=pauoj"
    echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD_VALUE}"
    echo "SEED_ADMIN_USERNAME=admin"
    echo "SEED_ADMIN_EMAIL=${ADMIN_EMAIL_VALUE}"
    echo "SEED_ADMIN_PASSWORD=${ADMIN_PASSWORD_VALUE}"
    echo "SEED_DEMO_DATA=false"
    echo "JUDGE_IMAGE=pauoj/judge:latest"
    echo "JUDGE_SWIFT_IMAGE=pauoj/judge-swift:latest"
    echo "JUDGE_CONCURRENCY=1"
    echo "JUDGE_HOST_DIR=${APP_DIR}/judge"
    echo "BACKUP_DIR=${APP_DIR}/backups"
    echo "RETENTION_DAYS=14"
    echo "SMTP_HOST=${SMTP_HOST_VALUE}"
    echo "SMTP_PORT=${SMTP_PORT_VALUE}"
    echo "SMTP_SECURE=true"
    echo "SMTP_USER=${SMTP_USER_VALUE}"
    echo "SMTP_PASSWORD=${SMTP_PASSWORD_VALUE}"
    echo "MAIL_FROM=PAU OJ <${SMTP_USER_VALUE}>"
    echo "EDGE_NETWORK=${EDGE_NETWORK}"
    echo "APP_MEM_LIMIT=768m"
    echo "WORKER_MEM_LIMIT=768m"
    echo "DB_MEM_LIMIT=384m"
    echo "REDIS_MEM_LIMIT=192m"
  } > "$ENV_FILE"
  unset SMTP_PASSWORD_VALUE POSTGRES_PASSWORD_VALUE ADMIN_PASSWORD_VALUE
  chmod 600 "$ENV_FILE"
  echo "Wrote $ENV_FILE; admin password is its SEED_ADMIN_PASSWORD value."
else
  echo "Using existing $ENV_FILE."
fi
# shellcheck disable=SC1090
set -a
. "$ENV_FILE"
set +a

# ---------------------------------------------------------------- caddy site
SITE_FILE="$CADDY_SITES_DIR/pauoj.caddy"
if [ -d "$CADDY_SITES_DIR" ]; then
  if grep -Rls --exclude="pauoj.caddy" "pauoj.nabasolution.tech" "$CADDY_SITES_DIR" >/dev/null 2>&1; then
    die "$APP_HOST already appears in another Caddy site file; inspect $CADDY_SITES_DIR"
  fi
  BACKUP=""
  if [ -f "$SITE_FILE" ]; then
    BACKUP="${SITE_FILE}.bak.$(date +%s)"
    cp -a "$SITE_FILE" "$BACKUP"
  fi
  cat > "$SITE_FILE" <<EOF
http://${APP_HOST} {
    import security_headers
    request_body {
        max_size 8MB
    }
    reverse_proxy pauoj-app:3000
}
EOF
  if ! docker exec "$CADDY_CONTAINER" caddy validate --config "$CADDY_CONFIG" >/dev/null 2>&1; then
    [ -n "$BACKUP" ] && cp -a "$BACKUP" "$SITE_FILE" || rm -f "$SITE_FILE"
    die "Caddy validation failed; restored the previous site file"
  fi
  docker exec "$CADDY_CONTAINER" caddy reload --config "$CADDY_CONFIG" >/dev/null 2>&1 ||
    die "Caddy reload failed; inspect $CADDY_CONTAINER"
  echo "Caddy site ready: $SITE_FILE"
else
  die "Missing Caddy sites directory $CADDY_SITES_DIR; set CADDY_SITES_DIR"
fi

# ---------------------------------------------------------------- build/deploy
if docker image inspect pauoj/app:latest >/dev/null 2>&1; then
  docker tag pauoj/app:latest pauoj/app:previous || true
fi
echo "Building the app image..."
compose build app || die "App image build failed"
if ! docker image inspect "${JUDGE_IMAGE:-pauoj/judge:latest}" >/dev/null 2>&1; then
  echo "Building the judge image..."
  compose --profile build build judge-image || die "Judge image build failed"
fi
if [ "$BUILD_SWIFT" = "1" ] && ! docker image inspect "${JUDGE_SWIFT_IMAGE:-pauoj/judge-swift:latest}" >/dev/null 2>&1; then
  echo "Building the Swift judge image..."
  compose --profile build build judge-swift-image || echo "WARNING: Swift judge image build failed; other languages still work."
fi

echo "Starting the stack (no PAU OJ Caddy)..."
compose up -d --wait db redis app worker || die "Stack did not become healthy"

if ! HEALTH_BODY="$(wait_for_health 60)"; then
  echo "Health check failed; app logs:" >&2
  compose logs --tail 100 app worker >&2 || true
  if docker image inspect pauoj/app:previous >/dev/null 2>&1; then
    echo "Rolling back to pauoj/app:previous..." >&2
    docker tag pauoj/app:previous pauoj/app:latest
    compose up -d --force-recreate app worker >&2 || true
  fi
  die "Deployment failed health check"
fi
echo "Health OK: $HEALTH_BODY"

echo "Seeding once (demo data is off)..."
compose --profile seed run --rm seed || echo "WARNING: seed failed; check the admin account manually."

echo "Checking Caddy from the host..."
if curl -fsS -H "Host: ${APP_HOST}" http://127.0.0.1/health >/dev/null 2>&1; then
  echo "Caddy host route OK: http://${APP_HOST}/health"
else
  echo "WARNING: Caddy did not route ${APP_HOST} to pauoj-app:3000; check the srv-edge network and Caddy import."
fi

echo "Checking HTTPS through Cloudflare..."
if curl -fsS --max-time 15 "https://${APP_HOST}/health" >/dev/null 2>&1; then
  echo "HTTPS OK: https://${APP_HOST}/health"
else
  echo "WARNING: https://${APP_HOST}/health is not reachable yet; check the Cloudflare tunnel catch-all and SSL mode."
fi

echo "Checking the edge proxy accepts a 5 MiB upload..."
UPLOAD_PROBE="$REPO_DIR/deploy/check-upload-limit.sh"
[ -f "$UPLOAD_PROBE" ] || die "Missing $UPLOAD_PROBE"
if [ -z "${APP_URL:-}" ]; then
  die "APP_URL is not set in $ENV_FILE; cannot probe the public upload limit"
fi
bash "$UPLOAD_PROBE" "$APP_URL" ||
  die "Public upload probe failed for ${APP_URL}: either the edge proxy rejects a 5 MiB body (raise request_body { max_size } to at least 8MB on the Caddy site, any CDN and any load balancer), or HTTPS is not reachable yet. Fix the proxy, then rerun this script."

echo "Testing SMTP..."
if [ -n "${SMTP_HOST:-}" ] && [ -n "${SMTP_PASSWORD:-}" ]; then
  if compose exec -T app node -e '
    const run = async () => {
      const mod = await import("nodemailer");
      const nodemailer = mod.default ?? mod;
      const t = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });
      await t.sendMail({
        from: process.env.MAIL_FROM,
        to: process.env.SEED_ADMIN_EMAIL,
        subject: "PAU OJ SMTP test",
        text: "PAU OJ SMTP is configured for " + process.env.APP_URL,
      });
      console.log("SMTP OK");
    };
    run().catch((error) => { console.error("SMTP FAIL", error.message); process.exit(1); });
  '; then
    echo "SMTP OK (checking the mailbox is still a manual step)."
  else
    echo "WARNING: SMTP auth/send failed; link-only invites still work. Fix SMTP_* in $ENV_FILE and restart the app."
  fi
else
  echo "SMTP is blank; link-only invites remain available."
fi

echo
echo "PAU OJ is up."
echo "  URL:    https://${APP_HOST}"
echo "  Admin:  admin (password: SEED_ADMIN_PASSWORD in $ENV_FILE)"
echo "  Data:   $APP_DIR (judge scratch: $APP_DIR/judge, backups: $APP_DIR/backups)"
echo "  Caddy:  $SITE_FILE -> pauoj-app:3000 (existing proxy stayed up)"
echo "  Env:    $ENV_FILE (keep it mode 600; rotate the mailbox password after sharing it)"
