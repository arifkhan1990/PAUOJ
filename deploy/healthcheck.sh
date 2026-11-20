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

echo "PAU OJ healthy."
