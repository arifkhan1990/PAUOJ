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

code="$(status /admin/lesson-reports)"
note "$([ "$code" = 307 ] || [ "$code" = 302 ] && echo 1 || echo 0)" "admin queue protected" "$code"

echo "SMOKE RESULT $pass passed, $fail failed"
[ "$fail" -eq 0 ]
