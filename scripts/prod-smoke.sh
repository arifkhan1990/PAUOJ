#!/usr/bin/env bash
# Public production smoke test. Usage: BASE_URL=https://... bash scripts/prod-smoke.sh
set -euo pipefail

BASE_URL="${BASE_URL:-https://pauoj.nabasolution.tech}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

pass=0
fail=0
note() {
  if [ "$1" = 1 ]; then
    printf 'PASS  %s%s\n' "$2" "${3:+ ($3)}"
    pass=$((pass + 1))
  else
    printf 'FAIL  %s%s\n' "$2" "${3:+ ($3)}"
    fail=$((fail + 1))
  fi
}

status() {
  curl -sS -m 15 -o "$TMP_DIR/body" -w '%{http_code}' "$BASE_URL$1" || echo 000
}

echo "Smoke testing $BASE_URL"

HEALTH="$(curl -sS -m 15 "$BASE_URL/health" || true)"
code="$(status /health)"
note "$([ "$code" = 200 ] && echo 1 || echo 0)" "health 200" "$code"
note "$(echo "$HEALTH" | grep -q '"status":"ok"' && echo 1 || echo 0)" "health status ok"
note "$(echo "$HEALTH" | grep -q '"workers":[1-9]' && echo 1 || echo 0)" "judge worker live"
note "$(echo "$HEALTH" | grep -q '"migrations":{[^}]*"ok":true' && echo 1 || echo 0)" "migrations current"
version="$(grep -m1 '"version"' package.json | sed -E 's/.*"version": *"([^"]+)".*/\1/')"
note "$(echo "$HEALTH" | grep -q "\"version\":\"$version\"" && echo 1 || echo 0)" "health version matches package" "$version"
note "$(echo "$HEALTH" | grep -Eq '"broadcastQueue"[[:space:]]*:[[:space:]]*\{[^}]*"pending"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health broadcastQueue pending is numeric"
note "$(echo "$HEALTH" | grep -Eq '"broadcastQueue"[[:space:]]*:[[:space:]]*\{[^}]*"oldestPendingSeconds"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health broadcast oldest age is numeric"
note "$(echo "$HEALTH" | grep -Eq '"judgeQueue"[[:space:]]*:[[:space:]]*\{[^}]*"waiting"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health judgeQueue waiting is numeric"
note "$(echo "$HEALTH" | grep -Eq '"judgeQueue"[[:space:]]*:[[:space:]]*\{[^}]*"active"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health judgeQueue active is numeric"
note "$(echo "$HEALTH" | grep -Eq '"judgeQueue"[[:space:]]*:[[:space:]]*\{[^}]*"failed"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health judgeQueue failed is numeric"
note "$(echo "$HEALTH" | grep -Eq '"judgeSlots"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health judgeSlots is numeric"
note "$(echo "$HEALTH" | grep -Eq '"memory"[[:space:]]*:[[:space:]]*\{[^}]*"rssMb"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health memory rss is numeric"
note "$(echo "$HEALTH" | grep -Eq '"memory"[[:space:]]*:[[:space:]]*\{[^}]*"limitMb"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health memory limit is numeric"
memory_limit="$(printf '%s' "$HEALTH" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("memory",{}).get("limitMb") or 0)' 2>/dev/null || echo 0)"
note "$([ "${memory_limit:-0}" = 0 ] || [ "${memory_limit:-0}" -ge 2500 ] && echo 1 || echo 0)" "health memory limit fits 10k SSE" "${memory_limit:-0}MB"
note "$(echo "$HEALTH" | grep -Eq '"network"[[:space:]]*:[[:space:]]*\{[^}]*"somaxconn"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health network somaxconn is numeric"
note "$(echo "$HEALTH" | grep -Eq '"network"[[:space:]]*:[[:space:]]*\{[^}]*"tcpMaxSynBacklog"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health network tcpMaxSynBacklog is numeric"
# The edge limit arrives through the Redis bridge written by the host cron, so
# 0 is normal before the first run or right after the container starts. Only
# the field being numeric is asserted here.
edge_limit="$(printf '%s' "$HEALTH" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("edge",{}).get("caddyMemoryLimitMb") or 0)' 2>/dev/null || echo 0)"
note "$(echo "$HEALTH" | grep -Eq '"edge"[[:space:]]*:[[:space:]]*\{[^}]*"caddyMemoryLimitMb"[[:space:]]*:[[:space:]]*[0-9]+' && echo 1 || echo 0)" "health edge caddyMemoryLimitMb is numeric" "${edge_limit:-0}MB"

for path in /learn /learn/basic-programming-math /learn/basic-programming-math/complexity /problems /rank; do
  code="$(status "$path")"
  note "$([ "$code" = 200 ] && echo 1 || echo 0)" "page $path 200" "$code"
done

code="$(status /problems/definitely-not-a-real-problem)"
note "$([ "$code" = 404 ] && echo 1 || echo 0)" "unknown problem returns 404" "$code"

status /learn/basic-programming-math/complexity >/dev/null
note "$(grep -q 'Lesson progress:' "$TMP_DIR/body" && echo 1 || echo 0)" "lesson donut rendered"
note "$(grep -q 'Was this lesson helpful' "$TMP_DIR/body" && echo 1 || echo 0)" "lesson reactions rendered"
note "$(grep -q 'Discussion' "$TMP_DIR/body" && echo 1 || echo 0)" "lesson discussion rendered"

status /learn >/dev/null
note "$(grep -q 'Learning tracks' "$TMP_DIR/body" && echo 1 || echo 0)" "learning index rendered"

status /problems >/dev/null
note "$(grep -q 'Show all' "$TMP_DIR/body" && echo 1 || echo 0)" "tag filter rendered"
note "$(grep -q 'aria-label="Open announcements and upcoming contests"' "$TMP_DIR/body" && echo 1 || echo 0)" "guest notification bell rendered"

code="$(curl -sS -m 15 -D "$TMP_DIR/announcement-headers" -o "$TMP_DIR/announcement-body" -w '%{http_code}' "$BASE_URL/api/v1/announcements" || echo 000)"
note "$([ "$code" = 200 ] && echo 1 || echo 0)" "announcements api 200" "$code"
note "$(grep -Eq '"data"[[:space:]]*:[[:space:]]*\[' "$TMP_DIR/announcement-body" && echo 1 || echo 0)" "announcements api data array"
announcement_cache="$(grep -i '^cache-control:' "$TMP_DIR/announcement-headers" || true)"
note "$(echo "$announcement_cache" | grep -q 'public' && echo 1 || echo 0)" "announcements api cache public"
note "$(echo "$announcement_cache" | grep -q 'max-age=60' && echo 1 || echo 0)" "announcements api cache max-age=60"

code="$(status /admin/lesson-reports)"
note "$([ "$code" = 307 ] || [ "$code" = 302 ] && echo 1 || echo 0)" "admin queue protected" "$code"

# Optional signed-in smoke. Enable with a disposable non-admin account:
#   SMOKE_USER=user@example.com SMOKE_PASSWORD=... bash scripts/prod-smoke.sh
if [ -n "${SMOKE_USER:-}" ] && [ -n "${SMOKE_PASSWORD:-}" ]; then
  COOKIE_JAR="$TMP_DIR/smoke-cookies"
  login_payload=$(SMOKE_USER="$SMOKE_USER" SMOKE_PASSWORD="$SMOKE_PASSWORD" python3 -c \
    'import json, os; print(json.dumps({"identifier": os.environ["SMOKE_USER"], "password": os.environ["SMOKE_PASSWORD"]}))')

  login_code=$(printf '%s' "$login_payload" | curl -sS -m 15 -o "$TMP_DIR/login-body" -w '%{http_code}' \
    -c "$COOKIE_JAR" -X POST \
    -H "Origin: $BASE_URL" \
    -H 'Content-Type: application/json' \
    --data-binary @- \
    "$BASE_URL/api/v1/auth/login" || echo 000)
  note "$([ "$login_code" = 200 ] && echo 1 || echo 0)" "signed-in login 200" "$login_code"

  authed_status() {
    curl -sS -m 15 -b "$COOKIE_JAR" -o "$TMP_DIR/smoke-body" -w '%{http_code}' "$BASE_URL$1" || echo 000
  }

  code=$(authed_status /)
  note "$([ "$code" = 200 ] && grep -q 'aria-label="Open notifications' "$TMP_DIR/smoke-body" && echo 1 || echo 0)" "signed-in header bell rendered" "$code"

  code=$(authed_status /dashboard)
  note "$([ "$code" = 200 ] && echo 1 || echo 0)" "signed-in dashboard 200" "$code"

  code=$(authed_status '/api/v1/notifications?filter=unread')
  note "$([ "$code" = 200 ] && grep -Eq '"meta"[[:space:]]*:[[:space:]]*\{[^}]*"unread"[[:space:]]*:[[:space:]]*[0-9]+' "$TMP_DIR/smoke-body" && echo 1 || echo 0)" "signed-in notifications unread numeric" "$code"

  code=$(authed_status /api/v1/social/counts)
  note "$([ "$code" = 200 ] && grep -Eq '"notifications"[[:space:]]*:[[:space:]]*[0-9]+' "$TMP_DIR/smoke-body" && echo 1 || echo 0)" "signed-in social counts numeric" "$code"

  logout_code=$(curl -sS -m 15 -o "$TMP_DIR/logout-body" -w '%{http_code}' \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST \
    -H "Origin: $BASE_URL" \
    "$BASE_URL/api/v1/auth/logout" || echo 000)
  logout_ok=0
  case "$logout_code" in 200 | 204) logout_ok=1 ;; esac
  note "$logout_ok" "signed-in logout 200/204" "$logout_code"

  after_dashboard=$(authed_status /dashboard)
  after_notifications=$(curl -sS -m 15 -b "$COOKIE_JAR" -o /dev/null -w '%{http_code}' \
    "$BASE_URL/api/v1/notifications" || echo 000)
  revoked=0
  case "$after_dashboard" in 3??) revoked=1 ;; esac
  if [ "$after_notifications" = 401 ]; then revoked=1; fi
  note "$revoked" "signed-in session revoked" "dashboard=$after_dashboard notifications=$after_notifications"
else
  echo "SKIP signed-in smoke (SMOKE_USER/SMOKE_PASSWORD not set)"
fi

echo "SMOKE RESULT $pass passed, $fail failed"
[ "$fail" -eq 0 ]
