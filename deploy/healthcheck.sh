#!/usr/bin/env bash
# Health check for cron/monitoring. Requires at least one live judge worker.
set -euo pipefail

HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/health}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"

fail() {
  local body="${1:-}"
  echo "PAU OJ health check FAILED at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  [ -n "$body" ] && echo "$body"
  if [ -n "$ALERT_WEBHOOK" ]; then
    curl -fsS --max-time 10 -X POST \
      -H "content-type: application/json" \
      -d '{"text":"PAU OJ health check failed","content":"PAU OJ health check failed"}' \
      "$ALERT_WEBHOOK" >/dev/null 2>&1 || true
  fi
  exit 1
}

BODY="$(curl -fsS --max-time 10 "$HEALTH_URL" 2>/dev/null)" || fail "Could not reach $HEALTH_URL"
echo "$BODY"

echo "$BODY" | grep -q '"status":"ok"' || fail "$BODY"
echo "$BODY" | grep -qE '"workers":[1-9][0-9]*' || fail "$BODY"

# A single stuck broadcast row keeps public announcements invisible; the worker
# normally drains within ~30s, so 10 minutes is a safe alert threshold. The
# field is absent on pre-rollout images, so skip the check there.
OLDEST_PENDING="$(printf '%s' "$BODY" | grep -oE '"oldestPendingSeconds":[0-9]+' | head -1 | grep -oE '[0-9]+' || true)"
if [ -n "$OLDEST_PENDING" ] && [ "$OLDEST_PENDING" -gt 600 ]; then
  fail "$BODY"
fi

# `/health` reports only the app cgroup limit, so a downgraded edge stays
# invisible there. This cron runs on the host: assert the shared Caddy limit.
# A missing container or Docker means the check does not apply (skip).
CADDY_MEM_MIN_BYTES=2097152000 # 2000 MiB, matches `docker update --memory 2000m`
if ! command -v docker >/dev/null 2>&1; then
  echo "note: docker not available; srv-caddy memory check skipped"
elif ! docker inspect srv-caddy >/dev/null 2>&1; then
  echo "note: srv-caddy not found; edge memory check skipped"
else
  CADDY_MEM="$(docker inspect -f '{{.HostConfig.Memory}}' srv-caddy 2>/dev/null || echo 0)"
  case "$CADDY_MEM" in ''|*[!0-9]*) CADDY_MEM=0 ;; esac
  if [ "$CADDY_MEM" -gt 0 ] && [ "$CADDY_MEM" -lt "$CADDY_MEM_MIN_BYTES" ]; then
    fail "srv-caddy memory limit ${CADDY_MEM}B is below 2000 MiB (${CADDY_MEM_MIN_BYTES}B) needed for ~10k proxied SSE; raise the edge cgroup"
  fi
  echo "edge: srv-caddy memory limit ${CADDY_MEM}B"
fi

echo "PAU OJ healthy."
