# Production deployment

This directory contains the hardened single-server deployment: Caddy TLS,
Postgres/Redis with no public ports, a health-checked app/worker stack, backups,
rollback, and a deploy workflow.

## 1. Server requirements

- Linux server with Docker Engine 27+ and the Compose plugin.
- A public DNS record, e.g. `oj.example.edu`, pointing at the server.
- Ports 80 and 443 open. PostgreSQL and Redis stay private.
- Enough disk for Docker images, judge workdirs and backups. The judge image is
  ~3.2 GB; budget at least 10 GB for images, workdirs and backups.

Install Docker from the official Docker Engine instructions, then verify:

```bash
docker version
docker compose version
```

## 1b. Capacity and scale (10k users / one 10k-contestant contest)

These are sizing targets, not measured results. Verify them with the load check
at the end of this section before a large round.

| Profile | Host |
| --- | --- |
| 10k live SSE viewers (recommended) | 8 vCPU / 16 GB |
| 10k HTTP/polling users, or ~5k SSE | 4 vCPU / 8 GB |
| Minimum | 2 vCPU / 4 GB (little headroom; judge and web compete for CPU) |

Budget on the recommended 16 GB host:

- `app`: 3 GB / 2 CPU (`mem_limit` now defaults to `3g`; local 10k SSE
  measurement: ~1.1 GB RSS direct and ~1.7 GB RSS through Caddy).
- `caddy`: 2000 MiB / 1 CPU (`mem_limit` defaults to `2000m`; local 10k
  proxied SSE measurement: ~0.9 GB RSS). A shared/campus edge proxy outside
  this stack needs the same memory and `nofile` headroom.
- `db`: 2 GB / 2 CPU with `max_connections=100` (the Postgres 17 default);
  raise `mem_limit`/`cpus` on the `db` service from the shipped 1 GB / 1 CPU.
- `redis`: 512 MB with AOF on (`mem_limit: 512m` is already set).
- `worker`: 2 GB (`mem_limit: 2g`); it runs beside the above and every judge run
  uses ~1 CPU.

The SSE numbers are local loopback measurements with 10k connections opened over
~50s (`--ramp-ms 5`). The app's production server (`scripts/production-server.cjs`,
shipped as `server.js` in the image and runnable from the repo with
`pnpm start:standalone`) listens with a backlog of 8192, caps connections at
20 000, and sets a 65s keep-alive / 66s headers timeout, so the accept queue no
longer overflows at Node's default 511. The effective backlog is still clamped
by the host's `net.core.somaxconn` (4096 on the reference host), so a 1s 10k SYN
burst remains kernel-bound: raise `net.core.somaxconn` (and apply with
`sysctl --system`) on hosts that must absorb such bursts without an edge proxy.
Re-measure on the target host before a large round.

Confirm the database ceiling and effective connection limits:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  exec -T db psql -U "${POSTGRES_USER:-pauoj}" -d "${POSTGRES_DB:-pauoj}" \
  -c 'show max_connections;'
```

Keep every pool below the database limit:

```text
app replicas × DATABASE_POOL_MAX
+ worker replicas × WORKER_DATABASE_POOL_MAX
+ headroom < max_connections
```

Each app and worker process opens its own pool, so scaling workers multiplies
database connections, not just CPU. `DATABASE_POOL_MAX` sets the app pool and
`WORKER_DATABASE_POOL_MAX` sets each worker pool (defaults 20 and 10). With
`max_connections=100`, one app and four workers use 20 + 4×10 = 60 connections
and leave room for migrations, the seed, `psql` sessions and other clients. Set
`DATABASE_POOL_MAX`, `WORKER_DATABASE_POOL_MAX`,
`DATABASE_STATEMENT_TIMEOUT_MS` and `DATABASE_CONNECT_TIMEOUT_SECONDS` in
`deploy/.env` and recreate app/worker to apply them. A query that hits
`DATABASE_STATEMENT_TIMEOUT_MS` fails with a statement-timeout error instead of
holding a pooled connection open; raise it deliberately (max 120000) if a
legitimate report or standings query needs longer. Migrations run on their own
client and are not affected.

### File descriptors and long-lived SSE

10k concurrent users includes up to ~10k open SSE verdict streams. Each stream
is one client socket plus one upstream socket in Caddy and one socket in the
app, and Docker's default `nofile` of 1024 runs out far earlier. `app`,
`worker` and `caddy` set `ulimits.nofile` to 65536 in
`deploy/docker-compose.prod.yml`; `deploy/docker-compose.shared.yml` sets it for
`app` and `worker` (its edge proxy is external), and the local compose file
matches for parity.

- The host limit matters too: the Docker daemon needs a high `LimitNOFILE`
  (systemd unit or `/etc/security/limits.conf`), at least the container value.
- Caddy keeps client keep-alive connections open and dedicates one upstream
  connection per SSE stream for the stream's lifetime. It streams
  `text/event-stream` without buffering, so never add an idle/response timeout
  to the SSE path.
- On a shared host the external edge proxy (Caddy/Cloudflare Tunnel) is not in
  this stack; raise its own nofile limit as well.

Verify after a restart:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml exec app sh -c 'ulimit -n'
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml exec caddy sh -c 'ulimit -n'
```

### Host listen backlog (kernel sysctls)

`net.core.somaxconn` is a per-network-namespace kernel limit; `docker update`
cannot change it. The app requests an 8192 listen backlog and Caddy's Go
listener uses the kernel cap directly, but both are still clamped by
`somaxconn`, so the 4096 reference default drops SYNs during a fast 10k ramp
even when the app and proxy are healthy. The repository Compose files set
`sysctls: net.core.somaxconn=16384` / `tcp_max_syn_backlog=16384` on the
app/edge containers; the srv-managed compose must add the same values, or set
them as root once per host (they are host state, not repository config):

```bash
printf '%s\n' \
  'net.core.somaxconn = 16384' \
  'net.ipv4.tcp_max_syn_backlog = 16384' \
  | sudo tee /etc/sysctl.d/60-pauoj-net.conf
sudo sysctl --system
```

`net.ipv4.tcp_max_syn_backlog` bounds half-open (SYN) sockets for the same
listeners; keep it equal to `somaxconn`. Give the Docker daemon and its systemd
unit `LimitNOFILE=65536` as well (drop-in under
`/etc/systemd/system/docker.service.d/`), otherwise the daemon caps the
container `ulimits.nofile` no matter what the Compose file requests. Reboot or
restart Docker only when that drop-in changes.

Verify without root:

```bash
sysctl net.core.somaxconn net.ipv4.tcp_max_syn_backlog
ss -ltn | grep -E ':(443|3000)\b'   # Send-Q = effective backlog per listener
```

`deploy/srv/deploy.sh pre` prints a warning (not a failure) when
`/proc/sys/net/core/somaxconn` is below 8192. `deploy/healthcheck.sh` fails when
the shared `srv-caddy` container exists with a memory limit below 2000 MiB, and
skips the check when `srv-caddy` or Docker is absent. The cron also publishes
that limit to the PAU OJ Redis as `pauoj:edge:caddy:memory` (`EX 900`, best
effort) so `/health` can expose it as `edge.caddyMemoryLimitMb`. `/health` also
reports `network: { somaxconn, tcpMaxSynBacklog }` from its own namespace, so
the app tier can be checked without host access.

### Judge scale-out

Judge workspaces are unique `mkdtemp` directories per run, so workers scale on
one host without colliding on files:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  up -d --scale worker=4
```

Each judge run uses ~1 CPU and each worker runs `JUDGE_CONCURRENCY` runs at a
time: four workers at `JUDGE_CONCURRENCY=2` offer eight concurrent runs, which
oversubscribes a 4 vCPU host and starves the web app. Keep judge runs at or below
the CPU count, and recheck the pool formula because every worker also opens a
database pool. `--scale worker=4` needs no published port, no `container_name`
and no named volume.

### 1,200-contestant profile

The srv deploy hook now targets **2 workers × `JUDGE_CONCURRENCY=2` = 4 judge
slots**, sized for ~1,200 contestants making 3–5 submissions each in a 2-hour
round (4,800–6,000 runs; roughly 1–1.25 hours at ~3s/run with 4 slots). It sets
`JUDGE_CONCURRENCY=2` and `JUDGE_WORKER_REPLICAS=2` in the host `.env` and
scales the worker after compose; an explicit larger operator value is
preserved. The app's `/health` reports `workers` and `judgeSlots`, so the live
profile is visible (`workers:2`, `judgeSlots:4`).

Registration is now 1,500/15 min per IP + 6,000/15 min global, enough for 1,200
campus-NAT signups in one window. Pre-register and ask contestants to log in
before the round. At this size the app's 4096 `somaxconn` is sufficient for a
1,200 burst; the 16,384 host/container sysctl is a 10k-SSE requirement. Same
second page loading of 1,200 users is ~4–5s at the measured 276 page rps, not a
failure.

### Load check

`scripts/capacity-load.mjs` is dependency-free (Node 22+, built-in `fetch`) and
GET-only:

```bash
node scripts/capacity-load.mjs \
  --url https://staging.example.edu \
  --path '/api/v1/contests/<slug>/standings?page=1&pageSize=50' \
  --path /contests/<slug>/standings \
  --concurrency 200 --duration 60 --max-p95-ms 1500
```

- Point it at a seeded contest. Standings are computed on demand and are the
  hot path for a 10k-contestant round, so test the API and the SSR page.
- Run it from a separate host, never from the app server, and never against
  production during a real contest.
- It exits 0 only when there is no 5xx/network error and p95 is within budget;
  exit 1 means the check failed, exit 2 means bad arguments. The last line is
  JSON (`| tail -1 | jq .`).
- It measures request throughput and latency, not 10k held SSE streams. Check
  `ulimit -n`, `/proc/<pid>/fd` and established connections for the stream side.

### Judge queue health and 10k SSE soak

`/health` reports the BullMQ depth of the `pauoj-judge` queue:
`judgeQueue: { waiting, active, prioritized, delayed, failed }`. `waiting` is
the unprioritized wait list, `prioritized` the priority list (every submission
gets a priority), `active` jobs running now, `delayed` retries/backoff and
`failed` retained failures. These counters are operational signal only: they
never change `status` or the HTTP code, and every field reads `0` when
Redis/BullMQ is unavailable (the probe is bounded to 2 s, so it cannot hang
`/health`).

`/health` also reports `memory: { rssMb, heapUsedMb, limitMb }`. For 10k SSE
the app needs ~1.7 GB RSS; `limitMb` must be comfortably above that (the prod
Compose default is 3 GB). A `0` means no cgroup limit is set. The `srv` deploy
hook also lifts the running `srv-pauoj` app to 3000m and `srv-caddy` to 2000m
after compose and restarts the app, because the srv-managed compose can still
hardcode the old 768m/256m shared defaults. Make those values persistent in
the srv compose when possible. A growing `waiting`/`prioritized` while `active` is pinned at the workers'
concurrency means the judge is saturated. Add workers manually with the
`--scale worker` command above and recheck the database pool formula; there is
no autoscaler, so a deploy never changes the worker count. Poll the depth with:

```bash
watch -n 5 'curl -fsS https://oj.example.edu/health | jq -c .judgeQueue'
```

`scripts/sse-soak.mjs` is a dependency-free (Node 22+) harness for the SSE
verdict streams. On a staging contest, seed at least N public *pending*
submissions, list their ids one per line in `ids.txt`, and run it from a
separate host:

```bash
node scripts/sse-soak.mjs \
  --url https://staging.example.edu \
  --ids-file ids.txt \
  --concurrency 10000 --hold 120 --timeout-ms 10000
```

- It opens HTTP(S) SSE connections with keep-alive agents
  (`maxSockets=concurrency`) in batches of 100, holds them for `--hold`
  seconds, then destroys everything. Ids are cycled when there are fewer ids
  than connections. Public pending submissions need no cookie; pass
  `--cookie '<raw Cookie header>'` for private ones (keep it out of shell
  history and logs).
- It counts opened/failed opens, initial and subsequent `update` events, `done`
  events, socket errors and RSS. Chunks are scanned for `event:` names only;
  response bodies are never buffered. The last line is JSON
  (`| tail -1 | jq .`).
- Exit 0 means every connection opened, emitted its initial `update` and had no
  socket error. Exit 1 means a failed open, fewer connections than
  `--concurrency`, an opened stream with no initial `update`, a socket error or
  a premature close; exit 2 means bad arguments.
- `initial update` should match `opened`. A `2xx` stream that sends no
  `update` fails the run and usually means the proxy answered with an HTML
  error page; check the status counts, the seeded ids and `--cookie`.
- The harness proves the app tier. It cannot attribute a failure to the app or
  the edge, so soak Caddy (and Cloudflare, if used) separately through the
  public URL, and check `ulimit -n`, `/proc/<pid>/fd` and established
  connections on the app and proxy while it runs. Never run it from the app
  server, and never against production during a real contest.

#### TLS soak recipe (local or staging)

Exercise TLS termination and compression without a public certificate by
running a throwaway Caddy on the soak host. Generate a self-signed pair once
(do not commit it):

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem \
  -days 1 -subj '/CN=localhost'
```

```caddyfile
:8443 {
	tls /path/to/cert.pem /path/to/key.pem
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000
}
```

```bash
caddy run --config Caddyfile          # leave running in another terminal
node scripts/sse-soak.mjs --url https://127.0.0.1:8443 --ids-file ids.txt \
  --insecure --concurrency 10000 --hold 120
```

`--insecure` disables certificate verification for this self-signed pair; the
report records `"insecure": true`. The harness uses an HTTPS/1.1 agent, so this
exercises TLS termination and Caddy's streaming path, not browser HTTP/2.
Verification stays on by default, so never pass `--insecure` against a real
endpoint. Compare this run with a direct `http://127.0.0.1:3000` soak to
separate app failures from proxy ones.

## 2. Clone and prepare

```bash
sudo mkdir -p /opt/pauoj
sudo chown "$USER":"$USER" /opt/pauoj
git clone <your-repository-url> /opt/pauoj
cd /opt/pauoj
sudo bash deploy/server-setup.sh
```

The setup script creates `/var/lib/pauoj/judge` (0700), `/var/backups/pauoj`,
opens ports 80/443 in ufw if present, and installs cron entries for backups and
health checks. It also copies `deploy/.env.example` to `deploy/.env` if missing.

Edit `deploy/.env` and set at minimum:

```env
APP_DOMAIN=oj.example.edu
APP_URL=https://oj.example.edu
POSTGRES_PASSWORD=<long random password>
SEED_ADMIN_PASSWORD=<long random password>
SEED_DEMO_DATA=false
```

`deploy/.env` is ignored by git. Keep it `chmod 600`.

Set the `SMTP_*` and `MAIL_FROM` values as well. Verification and password-reset
emails cannot be delivered without them. Test with a real address after deploy.

## 3. First deploy

```bash
cd /opt/pauoj
bash deploy/deploy.sh
```

This tags the previous image, builds `pauoj/app:latest`, builds the judge image
if missing, starts the stack, and waits for `/health` with at least one live
worker. If health fails it rolls back to the previous app image. The very first
deploy on a fresh host also builds `pauoj/judge:latest` once (~10 minutes); later
app-only deploys reuse it unless `judge/` changed (see the srv hook notes in
section 7).

Seed the database once:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  --profile seed run --rm seed
```

The admin username is printed; the password is `SEED_ADMIN_PASSWORD` from
`deploy/.env` (the seed intentionally does not print passwords in production).
The same seed populates `problem_reference_solutions` for all 607 problems
(471 Python references and 136 SQL references, including 4 script labs) used
by custom-test expected output; without it those runs show the
expected-output-unavailable note. Migration `0054` adds the SQL `script` flag.

Caddy obtains a TLS certificate automatically once DNS points at the server.
Check:

```bash
curl -fsS https://oj.example.edu/health
```

The health response must show `"status":"ok"` and `"workers":1` (or more).
It also reports `commit` (the deployed short SHA on the srv host, `null` when
`APP_COMMIT` is not wired) and `migrations: { applied, expected, ok }`. A database
that is behind the shipped drizzle journal returns `503` with
`"status":"degraded"`, so
a partial deploy cannot serve stale schema. The app container runs
`node dist/migrate.js` before `server.js`, so the normal compose path migrates
first. Migration `0046_dashboard_notification_links` is a data-only backfill
(rewrites stored notification hrefs to the `/dashboard/...` paths); rollback
safety comes from message read/delete matching both the old and new href
formats, not from a down migration. To check a database from the repo before
shipping:

```bash
pnpm db:check
```

### `/health` queue fields

`/health` reports three operational counters, two from the database and one
from Redis:

- `emailOutbox: { pending, failed }` — queued/failed transactional mail.
- `broadcastQueue: { pending, oldestPendingSeconds }` — broadcast rows whose
  fan-out has not finished (`broadcasts.completed_at is null`) and the age of
  the oldest one.
- `judgeQueue: { waiting, active, prioritized, delayed, failed }` — BullMQ
  depth of the `pauoj-judge` queue. It is a backlog signal only, never part of
  `status`/the HTTP code, and reads `0` when Redis is down. See section 1b for
  scaling workers when `waiting` grows.

`broadcastQueue.pending > 0` means the worker's broadcast sweep is behind or
stuck (it normally drains within ~30 s); `oldestPendingSeconds` distinguishes a
fresh burst from a stuck row. It is a warning, not an outage: the service stays
`ok`/`503`-free on this signal, but `deploy/healthcheck.sh` fails (and alerts)
once the oldest pending row is older than 10 minutes. Public announcements and
the guest drawer only show rows with `completed_at` set, so a stuck worker
leaves freshly published announcements invisible rather than half-delivered.
The database counters read as `0` when the table is missing (pre-migration) or
the query fails, so `/health` never fails on them. Investigate with:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs --tail 200 worker | grep -i broadcast
```

### `/health` network and edge fields

`/health` also reports `network: { somaxconn, tcpMaxSynBacklog }` — the effective
kernel listen limits in the app's network namespace — and
`edge: { caddyMemoryLimitMb }`, the shared edge cgroup limit rounded to MiB
(`0` when unknown). The app container cannot read the edge cgroup, so
`deploy/healthcheck.sh` publishes `srv-caddy`'s `HostConfig.Memory` to the PAU
OJ Redis as `pauoj:edge:caddy:memory` with `EX 900`. That key expires after 15
minutes, so a stopped cron makes the field fall back to `0` instead of reporting
a stale limit. Neither field changes `status` or the HTTP code;
`scripts/prod-smoke.sh` only asserts they are numeric.

## 3b. Shared host with an existing Caddy / Cloudflare Tunnel

> If the host runs the `srv` CLI (the naba server does), use
> `srv init nextjs <name>` + `srv deploy <name>` instead of this script. `srv`
> owns `core/caddy/sites` and regenerates the site on every deploy; a directly
> written site file is overwritten. This section is for shared hosts without
> `srv`.

Use this when the machine already runs another product on `:3000` and owns
ports 80/443 (for example `pauoj.nabasolution.tech` next to a `nabacare`
deployment). Do **not** use `deploy.sh` or the prod Compose file here: its app
port and Caddy service collide with the existing stack.

`deploy/deploy-shared.sh` keeps PAU OJ in its own Compose project (`pauoj`) and:

- publishes the app on `127.0.0.1:8081` (override with `APP_PORT`),
- joins the external `srv-edge` proxy network as `pauoj-app`,
- adds one Caddy site (`pauoj.nabasolution.tech` → `pauoj-app:3000`),
- uses the existing Cloudflare Tunnel catch-all (no DNS or port changes),
- keeps the other product's containers, volumes and ports untouched.

Run it on the server from the repository:

```bash
cd /home/naba/server/pauoj/app
git pull --ff-only
bash deploy/deploy-shared.sh
```

The first run prompts for the SMTP password and writes
`/home/naba/server/pauoj/deploy/.env` (mode 600) with generated database and
admin passwords. It builds the app and judge images, starts `db`, `redis`, `app`
and `worker` (no PAU OJ Caddy), seeds once with `SEED_DEMO_DATA=false`, and
checks the host/Caddy/HTTPS health. The admin password is
`SEED_ADMIN_PASSWORD` in that env file; it is never printed.

Overrides (environment variables): `APP_DIR`, `REPO_DIR`, `ENV_FILE`,
`APP_HOST`, `APP_PORT`, `EDGE_NETWORK`, `CADDY_SITES_DIR`, `CADDY_CONTAINER`,
`CADDY_CONFIG`, `SMTP_USER_VALUE`, `ADMIN_EMAIL_VALUE`, `BUILD_SWIFT=0` to skip
the Swift image.

Memory: the script defaults to `APP_MEM_LIMIT=768m`, `WORKER_MEM_LIMIT=768m`,
`DB_MEM_LIMIT=384m`, `REDIS_MEM_LIMIT=192m` and `JUDGE_CONCURRENCY=1`, because a
shared host may have little free RAM. Raise them only after checking `free -h`.
For a 10k-live-SSE round on a shared host, set `APP_MEM_LIMIT=3g` and give the
external edge proxy ~2 GB and 65k file descriptors; the 768m default only
fits small rounds. See section 1b.

### Premium learning payments (manual QR)

- Store stripped QR images on the host, **not in the repo**:
  `/home/naba/server/projects/pauoj/payment/bkash.png` and `citybank.png`
  (re-encode once to remove metadata; the repository is public).
- Mount that directory read-only into the web container at
  `/app/private/payment` and set `PAYMENT_QR_DIR=/app/private/payment` plus the
  `PAYMENT_BKASH_*` / `PAYMENT_CITYBANK_*` values in the project `.env`, then
  recreate the web container.
- QRs are served only to signed-in users by `/api/learning/payment-qr/<method>`
  with `X-Robots-Tag: noindex`; `/learn/pricing` is `noindex` too. Verify
  anonymous access returns `401` and the page hides the numbers.
- Prefer a dedicated business/merchant account over a personal bKash or bank
  account; personal accounts can be flagged for business collections.
- Before the paywall goes live on an existing install, run
  `pnpm learning:grant-legacy` (dry run) and then `--apply` so current
  learners keep the modules they were already studying.

### Backups on the `srv`-managed host

The compose-based `deploy/backup.sh` targets `deploy/.env`, which the `srv`
project does not use. Take a verified dump before **and** after a release:

```bash
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
docker exec srv-pauoj-db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > /home/naba/server/projects/pauoj/backups/pre-<version>-$STAMP.dump
docker exec -i srv-pauoj-db pg_restore --list \
  < /home/naba/server/projects/pauoj/backups/pre-<version>-$STAMP.dump > /dev/null
chmod 600 /home/naba/server/projects/pauoj/backups/*.dump
```

Automated operations on the same host:

- `deploy/backup-srv.sh` writes a verified dump; the `naba` crontab runs it
  daily at 03:30 with `PREFIX=daily` and a 14-day retention.
- `deploy/healthcheck.sh` runs every 5 minutes against the public `/health`
  and appends failures to `/home/naba/server/logs/pauoj-health.log`. Export
  `ALERT_WEBHOOK` in the cron line to POST failures to a chat webhook.
- After every deploy run `bash scripts/prod-smoke.sh` (health/version/
  migrations/worker/`broadcastQueue`, key pages, guest bell + announcements API,
  markers and the admin gate). Set `SMOKE_USER`/`SMOKE_PASSWORD` to also verify
  the signed-in bell, dashboard, notification API/counts and logout. Use a
  normal non-admin account created through `/register`; never use an admin
  account. The block is skipped when either variable is empty, and the deploy
  workflow passes the optional `SMOKE_USER`/`SMOKE_PASSWORD` repository secrets.
- After deploying rating changes, run `pnpm ratings:audit` (read-only) and
  confirm `critical: 0` and `warnings: 0`; `--strict` also fails on warnings.
  The worker must be running (or page views/`pnpm ratings:finalize` can drain
  due contests) so the one-hour rating sweep can finalize. After a rating-math
  upgrade, run `pnpm ratings:recompute` (dry run), inspect the delta, back up,
  then `pnpm ratings:recompute --apply`; a second apply is idempotent.
- Rehearse a restore by loading the newest dump into a scratch database:

```bash
DUMP=$(ls -t /home/naba/server/projects/pauoj/backups/*.dump | head -1)
docker exec srv-pauoj-db sh -c 'createdb -U "$POSTGRES_USER" pauoj_restore_check'
docker exec -i srv-pauoj-db sh -c \
  'pg_restore -U "$POSTGRES_USER" -d pauoj_restore_check --no-owner --no-acl' < "$DUMP"
docker exec srv-pauoj-db sh -c 'dropdb -U "$POSTGRES_USER" pauoj_restore_check'
```

Migrations are **forward-only**. The previous image runs against the newer
schema (extra tables are ignored), so an image-only rollback is safe; restoring
the database needs the pre-release dump. New public rows (for example learning
problems) stay visible to the old image unless the dump is restored.

Rollback: `docker compose --env-file /home/naba/server/pauoj/deploy/.env -f
deploy/docker-compose.shared.yml -p pauoj down` (keeps volumes), remove the
Caddy site file and reload the proxy. `deploy-shared.sh` also tags
`pauoj/app:previous` and recreates the app/worker from it if health fails. Never
stop the other product's project to free a port.

### When `srv deploy` reports a false success (T-075)

On the `srv`-managed host, `srv deploy pauoj` can print "deploy done" after the
app image build failed (for example a pnpm `ECONNRESET`) and pass health through
the old container. Verify the image tag and the version in `/health`, never the
word "done". Build with host networking and recreate only the app services:

```bash
cd /home/naba/server/projects/pauoj/source
git pull --ff-only
docker tag srv-pauoj-web srv-pauoj-web:pre-deploy
docker build --network host -t srv-pauoj-web -f Dockerfile .
cd ..
docker compose -p srv-pauoj -f compose.yml --env-file .env \
  up -d --no-build --force-recreate web worker
curl -fsS https://pauoj.nabasolution.tech/health
```

`-p srv-pauoj` is required: the running project name is `srv-pauoj`, even though
`compose.yml` declares `name: pauoj`. Without it Compose targets a different
volume set. If the server is low on memory, build the image on another machine,
stream it with `docker save | ssh ... 'gunzip | docker load'`, tag it
`srv-pauoj-web`, then run the same `up`. After a restart, retry the public health
check for up to a minute; Cloudflare can briefly return 502/530 while the tunnel
reconnects.

### Post-deploy checks and rollback

- `/health` must report the package version and `workers >= 1`.
- `/problems/<unknown-slug>` must return `404`; a `200` not-found shell means the
  proxy check is missing.
- The deploy runs `deploy/check-upload-limit.sh <base-url>`, which POSTs a
  5 MiB unauthenticated body to
  `/api/v1/messages/conversations/00000000-0000-0000-0000-000000000000/images`.
  `401` or `422` means the proxy passed the body (auth/validation rejected it);
  `413` means the edge proxy limit is below the app's 5 MiB DM images, so raise
  `request_body { max_size }` to at least `8MB`. The deploy fails and rolls back
  unless the probe gets `401`/`422`. Run it manually against any base URL to
  re-check:
  `bash deploy/check-upload-limit.sh https://oj.example.edu`.
- Retry the public URL for up to a minute after a restart (Cloudflare 502/530).
- After migration `0025`, an image-only rollback to 0.6.5 is unsafe: drop
  `problems_publication_public_check` first, because 0.6.5 problem creation inserts
  `is_public = true` with `publication_status = 'DRAFT'`. Then retag
  `srv-pauoj-web:pre-0.7.0` as `srv-pauoj-web:latest` and recreate web/worker. Keep
  the pre-deploy dump for a full restore.

## 3c. Client IP, `X-Forwarded-For` and rate limits

`src/server/api/request.ts` derives the client key from the **first**
`X-Forwarded-For` hop, then `X-Real-IP`. Public rate limits are only as good as
the edge that writes that header:

- **Dedicated Compose (`deploy/Caddyfile`).** Caddy 2 ignores client-supplied
  `X-Forwarded-*` values by default and rewrites `X-Forwarded-For` to the
  immediate peer, so a direct client → Caddy → app path already yields a
  trustworthy key. Do not add `header_up X-Forwarded-For {header.X-Forwarded-For}`
  or any other pass-through; that reintroduces spoofing. If Cloudflare is put in
  front of this Caddy, Caddy sees a Cloudflare edge IP instead of the client, so
  keys become coarse — spoofing is still blocked. Add the Cloudflare ranges via
  the global `servers { trusted_proxies ... }` option only if per-client keys
  matter.
- **Shared host / Cloudflare Tunnel (`docker-compose.shared.yml`).** The path is
  Cloudflare → tunnel (`cloudflared`) → the shared Caddy site → `pauoj-app:3000`.
  Cloudflare *appends* the visitor IP to `X-Forwarded-For` and also sets
  `CF-Connecting-IP`. Because the app reads the first hop, a client that sends
  its own `X-Forwarded-For` can win the first position. Fix it at the edge, not
  in the app: add a Cloudflare Transform Rule that **sets** `X-Forwarded-For` to
  `cf.connecting_ip` (overwrite, not append) for the OJ hostname. If the shared
  Caddy is between the tunnel and the app, it must trust the tunnel range
  (global Caddy `servers { trusted_proxies ... }`, not the generated site file,
  which `srv` rewrites) or it will overwrite the header with the tunnel IP and
  collapse every visitor into one bucket.
- **Global backstop.** `GET /api/v1/announcements` enforces 60/min per client key
  **and** 1200/min across all keys. Even with a fully spoofed `X-Forwarded-For`,
  an attacker can rotate keys only up to the global ceiling, which is sized for
  the whole instance (drawer polling from every open tab). Do not raise the
  per-key limit to "fix" a shared-IP problem; fix the edge header instead.

Verify the edge is writing what you expect. The limiter keys are
`announcements:<client-key>` and `announcements:global`, so one request with a
fake first hop shows whether the edge overwrote it:

```bash
curl -sS -o /dev/null https://oj.example.edu/api/v1/announcements \
  -H 'X-Forwarded-For: 203.0.113.9'
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  exec -T redis redis-cli --scan --pattern 'announcements:*'
```

`announcements:203.0.113.9` means the edge forwarded the client-supplied hop
(needs an overwrite rule); a real client/edge address means it overwrote
correctly. `announcements:global` is the instance-wide backstop.

## 3d. Lost admin access (offline recovery)

There is no web-accessible password reset for an admin who cannot sign in. Use
the offline recovery CLI on the server; it creates the account if it is missing
or resets the existing one.

1. Put a new long random value (at least 12 characters, not the default
   `ChangeMe123!`) in `SEED_ADMIN_PASSWORD` in the deploy env file. Keep the file
   mode `0600`; do not paste the password into shell history.
2. With the database running, run the recovery command for your topology.

**srv-managed host:**

```bash
cd /home/naba/server/projects/pauoj
docker compose -p srv-pauoj -f compose.yml --env-file .env \
  --profile seed run --rm --no-deps seed \
  node dist/reset-admin.js --confirm
```

**Standalone Compose:**

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  --profile seed run --rm --no-deps seed \
  node dist/reset-admin.js --confirm
```

The command looks up `SEED_ADMIN_USERNAME` and `SEED_ADMIN_EMAIL`, creates the
account when neither exists, or updates the single matching account. It sets
`role = ADMIN`, verifies the email, clears a ban, replaces the password, revokes
every session and pending auth token for that account, and writes an
`admin.recovery` audit row. It prints only the username, email and revocation
counts — never the password.
It refuses to run without `--confirm`, with the default or a sub-12-character
password, when the username and email already belong to two different accounts,
or when the matched account is not currently an admin. For an intentionally
demoted admin, add `--promote` to the command; a mistyped identifier then cannot
silently turn an ordinary user into an administrator. Set all three
`SEED_ADMIN_*` values explicitly in the deploy env rather than relying on the
fallback defaults.

After it succeeds, sign in with `SEED_ADMIN_USERNAME` (or the email) and the new
password. Rotate the password from Settings if the value in `.env` was only a
temporary recovery secret. The CLI is **never** run automatically by a deploy;
`dist/reset-admin.js` is only built into the app image for this manual step.

## 4. Backups

Manual backup:

```bash
sudo bash deploy/backup.sh
```

Cron runs it daily at 02:00 (from `server-setup.sh`). Files are written to
`/var/backups/pauoj/postgres` and `/var/backups/pauoj/redis`, with 14-day
retention. Copy backups off the server regularly.

Capacity: DM image bytes live in `message_attachments` (bytea) and are part of
every Postgres dump, so image traffic grows database and backup size directly —
monitor both. Per-sender quotas bound growth (50 images per rolling 24 hours,
250 MiB stored). If image volume ever outgrows DM use, object storage is the
future scale path instead of `bytea` in Postgres.

Restore (destructive):

```bash
sudo bash deploy/restore.sh /var/backups/pauoj/postgres/pauoj-<stamp>.dump --yes
```

The restore stops app/worker/Caddy, flushes transient Redis data, restores
PostgreSQL, starts the stack and checks health. Take a fresh backup before
restoring, and read the script before running it.

## 5. Monitoring

`deploy/healthcheck.sh` requires `status=ok`, at least one heartbeat from the
judge worker, and a broadcast queue whose oldest pending row is under 10
minutes. It also fails when a `srv-caddy` container is present with a memory
limit below 2000 MiB (2097152000 bytes), and prints a note and skips that check
when `srv-caddy` or Docker is unavailable. On the same run it publishes the
effective edge limit to Redis as `pauoj:edge:caddy:memory` (`EX 900`, best
effort; a missing `pauoj` Redis is only a note), which is how `/health` fills
`edge.caddyMemoryLimitMb` — the app container cannot read the shared edge cgroup
itself. `server-setup.sh` runs it every five minutes and appends to
`/var/log/pauoj-health.log`. Set `ALERT_WEBHOOK` in the cron line to post to
Slack/Discord-compatible webhooks.

Useful commands:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml ps
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml logs -f app worker caddy
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml exec app node -e "fetch('http://127.0.0.1:3000/health').then(async r=>console.log(await r.text()))"
```

## 6. Updates and rollback

```bash
cd /opt/pauoj
bash deploy/deploy.sh
```

The script pulls `main`, rebuilds the app, runs migrations on app start, waits
for health, and rolls back the app image on failure. Keep migrations backward
compatible so a rollback is safe. If language toolchains or the judge harness
change, rebuild the judge image:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  --profile build build judge-image
```

Manual rollback:

```bash
docker tag pauoj/app:previous pauoj/app:latest
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  up -d --force-recreate app worker caddy
```

### Learning content release

The learning curriculum is data, not a schema-only feature. After the app
migration has run, seed the curriculum once (the seed is idempotent and updates
existing problems by slug):

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  --profile seed run --rm seed
```

If the judge harness or language toolchain changed, rebuild the judge image as
shown above. Smoke-check `/learn`, one live module, one live topic and a
checkpoint start with a non-admin account. Confirm an unknown track returns
`404`, then check that a completed Module 1 checkpoint unlocks Module 2.

Migration `0026` is additive; a rollback to the previous app image keeps the new
table and seeded problems harmless.

### Notification delivery release

Migrations `0047`-`0049` add the notification preference columns, the
`broadcasts` ledger and the `email_outbox` queue. They are additive. Publishing
an announcement or marketing event only writes a broadcast row; the worker fans
it out within about 30 seconds and queues the emails. Keep the worker running
after the deploy, otherwise in-app announcements stay `Pending` and emails stay
`PENDING` in the outbox.

Check delivery after the restart:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  exec -T db psql -U "${POSTGRES_USER:-pauoj}" -d "${POSTGRES_DB:-pauoj}" \
  -c "select status, count(*) from email_outbox group by status order by status;"
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  exec -T db psql -U "${POSTGRES_USER:-pauoj}" -d "${POSTGRES_DB:-pauoj}" \
  -c "select kind, completed_at is null as pending from broadcasts order by created_at desc limit 5;"
```

`FAILED` outbox rows carry the last SMTP error and are not retried after five
attempts; inspect them before assuming mail is healthy. `/health` also reports
`emailOutbox.pending`, `emailOutbox.failed` and `broadcastQueue.pending` (rows
still awaiting fan-out; see `/health` queue fields in section 3). Delivered rows
are pruned after 30 days and failed rows after 90 days.

Browser push needs a VAPID keypair and HTTPS. Generate one with
`npx web-push generate-vapid-keys --json`, then set `WEB_PUSH_PUBLIC_KEY`,
`WEB_PUSH_PRIVATE_KEY` and `WEB_PUSH_SUBJECT` in `deploy/.env` and recreate
web/worker. Without both keys the public-key endpoint returns `null` and push
is disabled. Migration `0051` adds the `push_subscriptions` table; subscriptions
are per device and cascade with the user. `/sw.js` is served with `no-cache`; after a deploy, one reload updates
the service worker. Baseline broadcasts
(`baseline = true`) are migration history, not deliveries. A rollback to the
previous app image is safe for the additive schema, but the old worker does not
drain the outbox.

### Study plans release

Migrations `0032` and `0033` add sections, enrollment, plan metadata (`level`,
`estimated_minutes`, `is_featured`) and private per-problem notes. Both are
additive. The app container runs the migrations before `server.js`, so a normal
deploy applies them; seed once after the migrations to create or upgrade the
four curated plans:

```bash
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml \
  --profile seed run --rm seed
```

The seed is idempotent and preserves admin edits: it creates a missing seeded
plan, upgrades a legacy flat seeded plan once, and leaves a plan that already
has sections untouched. Study plans accept only published public problems; the
admin API rejects draft/private problems with `422`, and the public pages hide
a problem if it is withdrawn later.

Smoke-check `/lists`, one plan detail, the start/leave enrollment flow with a
signed-in non-admin account, and an unknown plan slug returning `404`. In the
admin queue, open `/admin/lists`, edit a plan's sections and confirm the public
page reflects the change. Also create a private plan from `/lists/new` as a
learner, add a per-problem note, reload and verify only that learner sees the
note; another account must get `404` on the private URL. Delete the plan and
confirm the note and enrollment rows are gone.

Rollback to the previous app image keeps the new tables/columns and is harmless;
no down migration is required.

## 7. CI/CD

`.github/workflows/deploy.yml` runs on GitHub-hosted runners after a green
**CI** run on `main` (and on manual dispatch). It does not build on the runner:
it calls the srv deploy hook at
`https://deploy.nabasolution.tech/deploy/pauoj` with `X-Deploy-Token`, waits for
the deploy queue to drain, then verifies `/health` (version, migrations, worker,
**exact commit**), `scripts/prod-smoke.sh` and the 5 MiB upload probe.

The CI `images` job proves the runtime image, not just the build. With Postgres
17 and Redis 8 service containers it runs `node dist/migrate.js` inside
`pauoj/app:ci`, then starts that image with `--network host` and waits up to
60 s for `http://127.0.0.1:3000/health` to report `"database":true`,
`"redis":true` and `"migrations":{...,"ok":true}`. `status` may stay `degraded`
because no worker runs in CI. On timeout it prints `docker logs`, removes the
container and fails the job, so a broken custom `server.js` cannot reach the srv
host.

### Exact-commit health check

`/health` reports `commit: process.env.APP_COMMIT?.trim() || null`. CI only
treats a deploy as healthy when `version`, `migrations.ok`, `workers >= 1` **and**
`commit` equals the 7-character short SHA it queued. A green build that never
reached production, or a stale container still answering the old version,
therefore fails the workflow with
`production health did not reach commit <short>` and prints the last health body.

The hook writes the value on the srv host; the server `compose.yml` must pass it
to the runtime. Keep these three pieces in sync:

1. `deploy/srv/deploy.sh` (`pre`) runs
   `git -C source rev-parse --short=7 HEAD` and writes/updates
   `APP_COMMIT=<short sha>` in the project `.env` (0600 preserved, key never
   duplicated). `post` does not touch `APP_COMMIT`.
2. `/home/naba/server/projects/pauoj/compose.yml` maps
   `APP_COMMIT: ${APP_COMMIT}` in the `web` and `worker` `environment` maps
   (`env_file: .env` alone also works, but the explicit mapping documents the
   contract and survives env-file changes).
3. `deploy/docker-compose.prod.yml` and `deploy/docker-compose.shared.yml` carry
   `APP_COMMIT: ${APP_COMMIT:-}` in their shared app environment anchor, so the
   app and worker images receive it at runtime.

`APP_COMMIT` is read at container start, not baked into the image: the running
container only reports the new commit after the deploy recreates web/worker. A
plain `docker restart` does not apply it.

Required repository secret (one time):

- `DEPLOY_TOKEN` = the shared `WEBHOOK_SECRET` from `~/server/.env` on
  `naba-solution`.

Without the secret the job logs a warning and skips the deploy; CI still passes.
The hook runs `srv deploy pauoj` on the server (git pull, host-network build,
migrate, recreate web/worker). Seed after a content release:

```bash
cd /home/naba/server/projects/pauoj
docker compose -p srv-pauoj -f compose.yml --env-file .env --profile seed run --rm seed
```

No self-hosted runner or `DEPLOY_DIR` variable is needed. The old
self-hosted-runner job is retired, and a stale CI run (main already moved on) is
skipped so an older commit cannot overwrite a newer deploy.

### srv deploy hook

`source/deploy/srv/deploy.sh` is symlinked to the project root as `deploy.sh`
(one-time: `ln -sfn source/deploy/srv/deploy.sh deploy.sh`). `srv deploy` runs
it around every release:

- `pre`: records the deployed commit (`APP_COMMIT`) for `/health`, warns when
  `APP_MEM_LIMIT`/`srv-caddy` memory or host `net.core.somaxconn` is below the
  10k-SSE target, then rebuilds `pauoj/judge:latest` when the contents of
  `source/judge` change, or when the image is missing, using a local
  `.judge-hash` marker. This prevents the worker from crash-looping when an
  app-only deploy leaves the judge sandbox image missing. Set `BUILD_SWIFT=1` to
  build the optional Swift image too.
- `post`: lifts the running app to 3000m, lifts `srv-caddy` to 2000m and then
  verifies the effective limit — it exits 1 (failing the deploy) if the edge
  stays above 0 and below 2000 MiB, and logs/skips when `srv-caddy` is absent.
  It then scales the judge to `JUDGE_WORKER_REPLICAS` (default 2) and runs the
  idempotent seed service, so new problems/references land with the release.

### First judge build on a fresh host

The first `srv deploy` (or `deploy.sh`) on a new host builds `pauoj/judge:latest`
once from `judge/` (about 10 minutes on the current host; the image is ~3.2 GB
and downloads the language toolchains). The build is cached: later app-only deploys skip it unless
the content hash of `judge/` changed or the image is missing. The optional Swift
image (`pauoj/judge-swift:latest`) is **not** built by default; run the deploy
with `BUILD_SWIFT=1` once to create it. Swift submissions fall back to a clear
"Swift judge image is missing" failure until it exists. There is no GHCR/image
registry pipeline: every host builds the judge image locally.

## 8. Security checklist

- `SEED_DEMO_DATA=false` in production; rotate the seeded admin password if you
  ever seeded demo data.
- Configure SMTP before launch and test both verification and password reset.
- Only expose ports 80/443 publicly. App port 3000 is bound to localhost.
- Keep `deploy/.env` private and backed up securely.
- The worker mounts the Docker socket. Use a dedicated judge host for a public,
  high-risk deployment and consider gVisor/rootless Docker.
- Rebuild the judge image when compiler/security updates are needed.
- Verify the reverse proxy allows an 8 MB request body (Caddy
  `request_body { max_size 8MB }`); anything lower makes DM image uploads
  return `413`. The deploy verifies this end to end with the 5 MiB
  `check-upload-limit.sh` probe and fails/rolls back if the probe does not get
  `401`/`422`. Rebuild the app/worker image after this change so the running
  containers pick up the new upload limits.
- Review `docker compose ... logs` after every deploy.
- Test restores on a schedule; an untested backup is not a backup.
