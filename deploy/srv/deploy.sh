#!/usr/bin/env bash
# srv deploy hook for the naba-solution host.
# Invoked by `srv deploy pauoj` after the git pull and before/after compose.
#
#   pre  -> build the judge image when the judge/ sources changed (or it is missing)
#   post -> seed the idempotent curriculum after the app is healthy
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/compose.yml" ]; then
  PROJECT_DIR="$SCRIPT_DIR"
else
  PROJECT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
fi
cd "$PROJECT_DIR"

env_value() {
  [ -f .env ] || return 0
  grep -E "^$1=" .env 2>/dev/null | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" || true
}

set_env() {
  # set_env KEY VALUE: update KEY in $PROJECT_DIR/.env (append if missing)
  # without duplicating it, keeping the file mode (0600 on the srv host).
  local key="$1" value="$2" mode tmp file="$PROJECT_DIR/.env"
  if [ -f "$file" ]; then
    mode="$(stat -c '%a' "$file" 2>/dev/null || echo 600)"
  else
    : > "$file"
    chmod 600 "$file"
    mode=600
  fi
  tmp="$(mktemp "$PROJECT_DIR/.env.XXXXXX")"
  chmod "$mode" "$tmp"
  awk -v k="$key" -v v="$value" '
    $0 ~ "^" k "=" && !done { print k "=" v; done = 1; next }
    { print }
    END { if (!done) print k "=" v }
  ' "$file" > "$tmp"
  mv "$tmp" "$file"
  chmod "$mode" "$file"
}

judge_hash() {
  # Content hash of the judge build context, stable across checkout paths.
  find source/judge -type f \
    ! -name '*.md' \
    -print0 2>/dev/null \
    | sort -z \
    | xargs -0 sha256sum 2>/dev/null \
    | sha256sum \
    | cut -c1-16
}

case "${1:-}" in
  pre)
    # srv runs this hook after the git sync, so HEAD is the code this deploy
    # builds. /health reports APP_COMMIT so CI can verify the exact commit.
    if APP_COMMIT="$(git -C source rev-parse --short=7 HEAD 2>/dev/null)"; then
      set_env APP_COMMIT "$APP_COMMIT"
      echo "→ APP_COMMIT=$APP_COMMIT"
    else
      echo "! source is not a git checkout; APP_COMMIT left unchanged" >&2
    fi

    # 10k live SSE streams measured ~1.7 GB RSS through Caddy. The shared
    # compose default (768m) would OOM well before that. Preserve an explicit
    # larger operator value; only lift the old/default small limits.
    current_app_limit="$(env_value APP_MEM_LIMIT)"
    case "$current_app_limit" in
      ""|768m|768M|1g|1G)
        set_env APP_MEM_LIMIT 3000m
        echo "→ APP_MEM_LIMIT=3000m for 10k SSE headroom"
        ;;
      *) echo "→ APP_MEM_LIMIT=$current_app_limit (operator override)" ;;
    esac

    available_mb="$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 0)"
    if [ "${available_mb:-0}" -gt 0 ] && [ "$available_mb" -lt 4096 ]; then
      echo "! host MemAvailable=${available_mb}MB; 10k SSE may pressure the shared host" >&2
    fi
    if docker inspect srv-caddy >/dev/null 2>&1; then
      caddy_limit="$(docker inspect -f '{{.HostConfig.Memory}}' srv-caddy 2>/dev/null || echo 0)"
      if [ "${caddy_limit:-0}" -gt 0 ] && [ "$caddy_limit" -lt 1610612736 ]; then
        echo "! srv-caddy memory=${caddy_limit}B; 10k proxied SSE needs ~1.5GB" >&2
      fi
    fi

    JUDGE_IMAGE="$(env_value JUDGE_IMAGE)"
    JUDGE_IMAGE="${JUDGE_IMAGE:-pauoj/judge:latest}"
    HASH="$(judge_hash)"
    HASH_FILE="$PROJECT_DIR/.judge-hash"
    CURRENT="$(cat "$HASH_FILE" 2>/dev/null || true)"

    if [ "$CURRENT" != "$HASH" ] ||
       ! docker image inspect "$JUDGE_IMAGE" >/dev/null 2>&1; then
      echo "→ judge image $JUDGE_IMAGE is missing/stale; building ($HASH)"
      docker build --network host -t "$JUDGE_IMAGE" source/judge
      printf '%s\n' "$HASH" > "$HASH_FILE"
    else
      echo "→ judge image $JUDGE_IMAGE is current ($HASH)"
    fi

    if [ "${BUILD_SWIFT:-0}" = "1" ]; then
      SWIFT_IMAGE="$(env_value JUDGE_SWIFT_IMAGE)"
      SWIFT_IMAGE="${SWIFT_IMAGE:-pauoj/judge-swift:latest}"
      if ! docker image inspect "$SWIFT_IMAGE" >/dev/null 2>&1; then
        echo "→ building $SWIFT_IMAGE"
        docker build --network host \
          -f source/judge/Dockerfile.swift \
          -t "$SWIFT_IMAGE" source/judge
      fi
    fi
    ;;

  post)
    echo "→ seeding curriculum (idempotent)"
    docker compose -p srv-pauoj -f compose.yml --env-file .env \
      --profile seed run --rm --no-deps seed
    ;;

  *)
    echo "usage: $0 pre|post" >&2
    exit 2
    ;;
esac
