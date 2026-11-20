#!/usr/bin/env bash
# Runs tasks from .ai/TASKS.md one by one, each in a fresh OpenCode session.
# Asks you for input only when a task is marked [?].
# Usage:   bash scripts/autopilot.sh
# Stop:    touch .ai/STOP   (finishes current task, then exits)
# Options (env): OC_MODEL=provider/model MAX_TASKS=300 MAX_RETRIES=2 TASK_TIMEOUT=3600 BRANCH=main
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

TASKS=.ai/TASKS.md; QUESTIONS=.ai/QUESTIONS.md; ANSWERS=.ai/ANSWERS.md; PROGRESS=.ai/PROGRESS.md
LOG_DIR=.ai/logs; mkdir -p "$LOG_DIR"
MAX_TASKS=${MAX_TASKS:-300}; MAX_RETRIES=${MAX_RETRIES:-2}; TASK_TIMEOUT=${TASK_TIMEOUT:-3600}
BRANCH=${BRANCH:-$(git branch --show-current)}; OC_MODEL=${OC_MODEL:-}

log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG_DIR/autopilot.log"; }
oc()  { timeout "$TASK_TIMEOUT" opencode run ${OC_MODEL:+-m "$OC_MODEL"} "$1" 2>&1 | tee -a "$LOG_DIR/$(date +%F).log"; return "${PIPESTATUS[0]}"; }

status_of()    { grep -m1 -E "^- \[.\] $1\b" "$TASKS" | sed -E 's/^- \[(.)\].*/\1/'; }
next_task()    { grep -m1 -E '^- \[ \] T-[0-9]+' "$TASKS" | sed -E 's/^- \[ \] (T-[0-9]+).*/\1/'; }
blocked_task() { grep -m1 -E '^- \[\?\] T-[0-9]+' "$TASKS" | sed -E 's/^- \[\?\] (T-[0-9]+).*/\1/'; }
set_status()   { sed -i.bak -E "s/^- \[.\] ($1\b)/- [$2] \1/" "$TASKS" && rm -f "$TASKS.bak"; }

ask_user() {
  local id="$1" var val answer vars set_vars=""
  echo; echo "========== Input needed for $id =========="; cat "$QUESTIONS"; echo "=========================================="
  vars=$(grep -E '^ENV: ' "$QUESTIONS" | sed -E 's/^ENV: *([A-Za-z0-9_]+).*/\1/')
  for var in $vars; do
    read -rsp "Value for $var (hidden; saved to local .env only): " val < /dev/tty; echo
    touch .env; grep -v "^$var=" .env > .env.tmp || true; mv .env.tmp .env
    printf '%s=%s\n' "$var" "$val" >> .env; set_vars="$set_vars $var"
    echo "  -> Remember to add $var to the server env file too (/etc/<app>/.env)."
  done
  read -rp "Answer / notes (Enter to skip): " answer < /dev/tty
  { echo; echo "## $id"; grep -E '^Q:' "$QUESTIONS" || true
    echo "A: ${answer:-<none>}"; [ -n "$set_vars" ] && echo "Env vars set in .env (names only):$set_vars"; } >> "$ANSWERS"
  printf '# Open question (written by AI, cleared by autopilot)\n' > "$QUESTIONS"
  set_status "$id" " "
}

wait_ci() {
  command -v gh >/dev/null 2>&1 || return 0
  local run attempt
  for attempt in 1 2 3; do
    sleep 15
    run=$(gh run list --branch "$BRANCH" --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || true)
    [ -z "$run" ] && return 0
    log "Waiting for CI/CD run $run"
    if gh run watch "$run" --exit-status >/dev/null 2>&1; then log "CI/CD green"; return 0; fi
    log "CI/CD failed (fix attempt $attempt/3)"
    oc "The last push failed CI/CD. Fix this first, verify with scripts/verify.sh, commit and push. Failure log (tail): $(gh run view "$run" --log-failed 2>&1 | tail -80)"
    git push >/dev/null 2>&1 || true
  done
  return 1
}

post_task() {
  local id="$1"
  if [ -n "$(git status --porcelain)" ]; then
    log "Uncommitted changes after $id, asking AI to clean up"
    oc "Task $id is marked done but 'git status' shows uncommitted changes. Commit what belongs (conventional commit), delete what does not, then push."
  fi
  git push >/dev/null 2>&1 || git push -u origin "$BRANCH" >/dev/null 2>&1 || log "WARNING: git push failed"
  bash scripts/check-repo-hygiene.sh || oc "Repo hygiene check failed. Untrack forbidden files, update .gitignore, commit and push."
  wait_ci
}

count=0; retries=0
while [ "$count" -lt "$MAX_TASKS" ]; do
  [ -f .ai/STOP ] && { log "STOP file found, exiting."; break; }

  blocked=$(blocked_task || true)
  if [ -n "$blocked" ]; then ask_user "$blocked"; continue; fi

  id=$(next_task || true)
  if [ -z "$id" ]; then
    log "ALL TASKS COMPLETED."
    bash scripts/verify.sh && log "Final verify OK"
    echo; echo "Pending inputs you still need to provide:"; sed -n '/^## Pending inputs/,/^## /p' "$PROGRESS" | sed '$d'
    break
  fi

  log "Starting $id (attempt $((retries + 1)))"
  oc "Autopilot mode. Follow AGENTS.md and .opencode/rules/autonomy.md. Do ONLY task $id from .ai/TASKS.md following workflow.md section C: implement, verify with scripts/verify.sh, update docs and changelog, commit, push. Read .ai/ANSWERS.md for earlier user answers. Do not ask questions in chat; if you truly need user input follow autonomy.md. When finished set the task to [x] in .ai/TASKS.md and stop."

  case "$(status_of "$id")" in
    x) log "$id done"; retries=0; count=$((count + 1)); post_task "$id" || { log "CI/CD still failing, stopping."; break; } ;;
    '?') retries=0 ;;
    *) retries=$((retries + 1))
       if [ "$retries" -gt "$MAX_RETRIES" ]; then set_status "$id" "!"; log "$id failed $retries times, marked [!]. Stopping."; break; fi ;;
  esac
done
log "Autopilot finished ($count tasks this run)."
