# Production deployment

This directory contains the hardened single-server deployment: Caddy TLS,
Postgres/Redis with no public ports, a health-checked app/worker stack, backups,
rollback, and a deploy workflow.

## 1. Server requirements

- Linux server with Docker Engine 27+ and the Compose plugin.
- A public DNS record, e.g. `oj.example.edu`, pointing at the server.
- Ports 80 and 443 open. PostgreSQL and Redis stay private.
- Enough disk for Docker images, judge workdirs and backups. The judge image is
  ~800 MB; budget several GB.

Install Docker from the official Docker Engine instructions, then verify:

```bash
docker version
docker compose version
```

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
worker. If health fails it rolls back to the previous app image.

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
It also reports `migrations: { applied, expected, ok }`; a database that is
behind the shipped drizzle journal returns `503` with `"status":"degraded"`, so
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
  migrations/worker, key pages, markers and the admin gate).
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

`deploy/healthcheck.sh` requires `status=ok` and at least one heartbeat from the
judge worker. `server-setup.sh` runs it every five minutes and appends to
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
`emailOutbox.pending` and `emailOutbox.failed`. Delivered rows are
pruned after 30 days and failed rows after 90 days.

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

`.github/workflows/deploy.yml` is a manual `workflow_dispatch` job that runs on a
self-hosted runner labeled `prod`. Install the runner on this server, add the
runner labels, then set repository variables:

- `DEPLOY_DIR` = `/opt/pauoj`
- `HEALTH_URL` = `http://127.0.0.1:3000/health`

The runner user needs Docker access and write access to `DEPLOY_DIR`. Prefer a
manual dispatch or protected environment approval for production. Do not run the
deploy job on a shared/dirty machine.

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
