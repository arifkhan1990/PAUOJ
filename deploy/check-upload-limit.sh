#!/usr/bin/env bash
# Post-deploy probe: prove the public edge proxy forwards a 5 MiB DM image upload.
#
# The app accepts 5 MiB message images and the bundled Caddy allows an 8MB
# request body, but a shared or external proxy (or CDN) with a lower limit still
# answers 413 before the request reaches the app. This probe posts a real 5 MiB
# multipart body through the public URL and expects the app to answer 401 (no
# session) or 422 (validation) - never 413.
#
# Manual usage (run on the server, after a deploy):
#   bash deploy/check-upload-limit.sh https://oj.example.edu
#   bash deploy/check-upload-limit.sh https://oj.example.edu 3   # attempts
#
# Exit codes: 0 = the proxy forwarded the body to the app; 1 = blocked or
# unreachable. The request is unauthenticated on purpose, so no secret is sent
# or printed.
set -euo pipefail

BODY_BYTES=$((5 * 1024 * 1024))
UPLOAD_PATH="/api/v1/messages/conversations/00000000-0000-0000-0000-000000000000/images"
ATTEMPTS_DEFAULT=10
RETRY_SLEEP_SECONDS=3
REQUEST_TIMEOUT_SECONDS=30

die() {
  echo "ERROR: $*" >&2
  exit 1
}

usage() {
  echo "Usage: $0 <base-url> [attempts]" >&2
  exit 2
}

[ "$#" -ge 1 ] || usage
BASE_URL="${1%/}"
[ -n "$BASE_URL" ] || usage
ATTEMPTS="${2:-$ATTEMPTS_DEFAULT}"
case "$ATTEMPTS" in
  '' | *[!0-9]*) die "attempts must be a positive integer, got '$ATTEMPTS'" ;;
esac
[ "$ATTEMPTS" -ge 1 ] || die "attempts must be at least 1"
TARGET_URL="${BASE_URL}${UPLOAD_PATH}"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/pauoj-upload-probe.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT
BOUNDARY="pauoj-probe-$$-$(date +%s)"
BODY_FILE="$TMP_DIR/body.bin"
RESPONSE_FILE="$TMP_DIR/response.txt"

# Exactly BODY_BYTES of binary junk inside a multipart file part. The multipart
# framing pushes the total slightly over 5 MiB, like a real image upload.
build_body() {
  {
    printf -- '--%s\r\n' "$BOUNDARY"
    printf 'Content-Disposition: form-data; name="file"; filename="probe.bin"\r\n'
    printf 'Content-Type: application/octet-stream\r\n\r\n'
    head -c "$BODY_BYTES" /dev/urandom
    printf '\r\n--%s--\r\n' "$BOUNDARY"
  } >"$BODY_FILE"
}

# Prints the HTTP status; prints 000 when the connection itself failed.
probe_once() {
  curl --silent --show-error \
    --max-time "$REQUEST_TIMEOUT_SECONDS" \
    --request POST \
    --header "Content-Type: multipart/form-data; boundary=${BOUNDARY}" \
    --data-binary "@${BODY_FILE}" \
    --output "$RESPONSE_FILE" \
    --write-out '%{http_code}' \
    "$TARGET_URL"
}

describe_response() {
  [ -s "$RESPONSE_FILE" ] || return 0
  local snippet
  snippet="$(tr -d '\r\n' <"$RESPONSE_FILE" | head -c 160)" || snippet=""
  [ -n "$snippet" ] && echo "Response: $snippet" >&2
  return 0
}

echo "Probing 5 MiB upload through ${TARGET_URL}"
build_body

status=""
attempt=1
while [ "$attempt" -le "$ATTEMPTS" ]; do
  if ! status="$(probe_once)"; then
    status="000"
  fi
  echo "Attempt ${attempt}/${ATTEMPTS}: HTTP ${status}"

  case "$status" in
    401 | 422)
      echo "PASS: proxy forwarded the 5 MiB body; app answered ${status} (${TARGET_URL})"
      exit 0
      ;;
    413)
      # Deterministic proxy rejection; extra attempts cannot help.
      break
      ;;
  esac

  if [ "$attempt" -lt "$ATTEMPTS" ]; then
    # First deploy may need DNS/TLS warm-up; other errors may be transient.
    sleep "$RETRY_SLEEP_SECONDS"
  fi
  attempt=$((attempt + 1))
done

describe_response

if [ "$status" = "413" ]; then
  die "edge proxy rejected the 5 MiB upload with 413 at ${TARGET_URL}. Raise request_body { max_size } to at least 8MB on Caddy/edge proxy (and any CDN or load balancer in front), then deploy again."
fi

die "upload probe failed at ${TARGET_URL} (last HTTP status: ${status}). Expected 401 or 422 from the app; check that the public URL is reachable and the proxy forwards POST bodies to the app."
