#!/usr/bin/env bash
# Single quality gate used by developers, the AI, autopilot and CI.
set -euo pipefail
cd "$(dirname "$0")/.."

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  bash scripts/check-repo-hygiene.sh
fi

pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm learning:check
pnpm learning:audit
pnpm build
pnpm build:worker

if pnpm audit --prod --audit-level=high >/dev/null 2>&1; then
  echo "Dependency audit OK"
else
  echo "Dependency audit reported high severity issues (review before release)" >&2
fi

echo "verify OK"
