#!/usr/bin/env bash
# Build, deploy, wait for health, and roll back to the previous app image on failure.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
ENV_FILE="${ENV_FILE:-$DEPLOY_DIR/deploy/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-$DEPLOY_DIR/deploy/docker-compose.prod.yml}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/health}"
env_value() {
  [ -f "$ENV_FILE" ] || return 0
  grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2-
}
JUDGE_IMAGE="${JUDGE_IMAGE:-$(env_value JUDGE_IMAGE)}"
JUDGE_IMAGE="${JUDGE_IMAGE:-pauoj/judge:latest}"
JUDGE_SWIFT_IMAGE="${JUDGE_SWIFT_IMAGE:-$(env_value JUDGE_SWIFT_IMAGE)}"
JUDGE_SWIFT_IMAGE="${JUDGE_SWIFT_IMAGE:-pauoj/judge-swift:latest}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

wait_for_health() {
  local attempts="${1:-30}"
  for _ in $(seq 1 "$attempts"); do
    local body
    body="$(curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null || true)"
    if echo "$body" | grep -q '"status":"ok"' &&
       echo "$body" | grep -qE '"workers":[1-9][0-9]*'; then
      echo "Health OK: $body"
      return 0
    fi
    sleep 2
  done
  return 1
}

[ -f "$ENV_FILE" ] || die "Missing $ENV_FILE. Copy deploy/.env.example and fill it in."
command -v docker >/dev/null 2>&1 || die "Docker is not installed."
docker compose version >/dev/null 2>&1 || die "Docker Compose plugin is not installed."

cd "$DEPLOY_DIR"

if [ "${SKIP_GIT_PULL:-0}" != "1" ]; then
  if [ -d .git ]; then
    echo "Pulling latest code..."
    git pull --ff-only
  else
    echo "WARNING: $DEPLOY_DIR is not a git checkout; skipping pull."
  fi
fi

if docker image inspect pauoj/app:latest >/dev/null 2>&1; then
  docker tag pauoj/app:latest pauoj/app:previous
  echo "Tagged current app image as pauoj/app:previous."
fi

echo "Building app image..."
compose build app

if ! docker image inspect "$JUDGE_IMAGE" >/dev/null 2>&1; then
  echo "Judge image $JUDGE_IMAGE is missing; building it..."
  compose --profile build build judge-image
fi

if ! docker image inspect "$JUDGE_SWIFT_IMAGE" >/dev/null 2>&1; then
  echo "Swift judge image $JUDGE_SWIFT_IMAGE is missing; building it..."
  compose --profile build build judge-swift-image
fi

echo "Starting stack..."
compose up -d --wait

if wait_for_health 45; then
  echo "Deployment complete."
  exit 0
fi

echo "Health check failed; collecting logs..." >&2
compose ps >&2 || true
compose logs --tail 80 app worker caddy >&2 || true

if docker image inspect pauoj/app:previous >/dev/null 2>&1; then
  echo "Rolling back to pauoj/app:previous..." >&2
  docker tag pauoj/app:previous pauoj/app:latest
  compose up -d --force-recreate app worker caddy >&2 || true
  if wait_for_health 30; then
    echo "Rollback healthy." >&2
  else
    echo "Rollback also failed; manual intervention required." >&2
  fi
fi

exit 1
