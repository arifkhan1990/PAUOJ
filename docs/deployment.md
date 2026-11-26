> Production path: use `deploy/docker-compose.prod.yml`, `deploy/Caddyfile` and
> `deploy/README.md`. The rest of this document describes the base Compose stack
> and manual steps; the `deploy/` runbook is the hardened single-server path.

# Deployment guide

## Target topology

```text
Internet
  │ HTTPS
  ▼
Reverse proxy (Caddy/Nginx) ──► app:3000
                                  │
                                  ├── PostgreSQL
                                  ├── Redis
                                  └── worker ──► Docker socket ──► judge containers
```

For a public judge, ideally separate the worker and its Docker daemon onto a
dedicated host. The web process should never mount the Docker socket.

## Server setup

1. Install Docker Engine + Compose plugin.
2. Create a project directory owned by the deploy user.
3. Create `/etc/pauoj/pauoj.env` with production values and `chmod 640` it:

```env
APP_URL=https://oj.example.edu
POSTGRES_DB=pauoj
POSTGRES_USER=pauoj
POSTGRES_PASSWORD=<long random value>
DATABASE_URL=postgres://pauoj:<long random value>@db:5432/pauoj
REDIS_URL=redis://redis:6379
JUDGE_IMAGE=pauoj/judge:latest
JUDGE_SWIFT_IMAGE=pauoj/judge-swift:latest
JUDGE_CONCURRENCY=2
JUDGE_HOST_DIR=/var/lib/pauoj/judge
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_EMAIL=admin@example.edu
SEED_ADMIN_PASSWORD=<long random value>
SEED_DEMO_DATA=false
```

4. Create the judge scratch directory on the host. It must be the same absolute
   path that the worker container sees, because the host Docker daemon mounts
   test files into judge containers:

```bash
sudo install -d -m 700 -o root -g root /var/lib/pauoj/judge
```

5. Point Compose at the env file, or copy it to `.env` on the server. Do not put
   production secrets in git.
6. Build:

```bash
docker compose --profile build build
```

7. Start:

```bash
docker compose up -d --wait
docker compose --profile seed run --rm seed
```

8. Confirm:

```bash
curl -fsS http://127.0.0.1:3000/health
```

The app container runs database migrations before `server.js` starts.

## Reverse proxy and TLS

Put Caddy or Nginx in front of port 3000. Set `APP_URL` to the public HTTPS
origin; secure cookies are enabled automatically when `APP_URL` starts with
`https://`. Forward the original `Origin` and `Host` headers so same-origin
checks continue to work. Recommended headers are already sent by the app; the
proxy should also enforce HSTS and request-size limits.

The app derives the rate-limit client key from the **first** `X-Forwarded-For`
hop (falling back to `X-Real-IP`), so the proxy must own that header: overwrite
it with the peer address, or append to a chain you control, and never pass an
incoming client-supplied value through. Caddy 2 does this by default. Behind
Cloudflare (proxy or Tunnel) the visitor IP arrives as `CF-Connecting-IP`, and
Cloudflare *appends* to `X-Forwarded-For`, so a client can occupy the first
position; set `X-Forwarded-For` to `cf.connecting_ip` in a Cloudflare Transform
Rule for the OJ hostname. `GET /api/v1/announcements` additionally has a
30,000/min instance-wide limit and a 30s in-process cache that bound
spoofed-key abuse. See section 3c of `deploy/README.md` for per-topology details
and a Redis-key check.

## Transactional email

Verification, password reset, review notifications and assessment invite emails all go through
the existing SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
`SMTP_PASSWORD`, `MAIL_FROM` — see `.env.example`). Nothing blocks on mail: assessment invites
fall back to copy-the-link, and link-only candidates never need SMTP.

Sending requires an authenticated sender record (deployment prerequisite, not a code change):

| Item | Value |
| --- | --- |
| Sending domain | Dedicated transactional subdomain `notify.<app-domain>` — never the root domain. If the university cannot delegate a subdomain, use a dedicated domain you control for transactional mail only. |
| Provider | Amazon SES SMTP, region `ap-southeast-1` |
| DKIM | Easy DKIM, 2048-bit, all three CNAMEs verified |
| SPF / MAIL FROM | Custom MAIL FROM `bounce.notify.<app-domain>` so SPF aligns with the From domain; set `MAIL_FROM` to `PAU OJ <no-reply@notify.<app-domain>>` |
| DMARC | `p=none` → `quarantine` → `reject`, phased after monitoring; `rua`/`ruf` to the bounce owner |
| Reply-To | A monitored mailbox owned by the operator |
| Transport | TLS required; no Gmail or personal SMTP |
| Pilot fallback | Brevo free tier (300/day) with the same domain authentication, if SES cannot be provisioned in time |

A dedicated subdomain isolates the judge's mail reputation from the university's main domain.
Google's sender guidelines require SPF or DKIM for all senders and SPF + DKIM + DMARC for bulk
senders, with DMARC alignment matching the From address
(<https://support.google.com/a/answer/81126>); AWS documents Easy DKIM, a custom MAIL FROM and a
phased DMARC rollout as the standard SES path
(<https://docs.aws.amazon.com/ses/latest/dg/email-authentication-dmarc.html>) — both accessed
2026-11-21. Check the local Mailpit inbox (<http://localhost:8025>) before trusting production
delivery.

## Backups

- PostgreSQL: schedule `pg_dump -Fc` and retain off-host copies.
- Redis: AOF is enabled in Compose. Queue data is transient, but keep Redis
  snapshots if you need run-result continuity.
- Judge work directory: ephemeral; no backup needed.
- Test restores on a schedule. A backup that has never been restored is not a
  backup.

## Monitoring

- `/health` for uptime checks. Besides `status`/`workers`/`migrations`, it
  exposes `emailOutbox: { pending, failed }`,
  `broadcastQueue: { pending, oldestPendingSeconds }` and
  `judgeQueue: { waiting, active, prioritized, delayed, failed }`. `broadcastQueue.pending >
  0` means broadcasts are still awaiting worker fan-out; public announcements
  stay hidden until `completed_at` is set, and a rising `oldestPendingSeconds`
  means the sweep is stalled. None of these counters changes the health status;
  the table-backed counters read `0` if their tables are missing, and
  `deploy/healthcheck.sh` treats an oldest broadcast age above 10 minutes as a
  failure so cron/webhooks catch a stuck row. `judgeQueue` is the Redis-backed
  BullMQ depth: `waiting`/`prioritized` growing while `active` is pinned at the
  worker concurrency means the judge is saturated; it reads `0` when Redis is
  unavailable. `scripts/prod-smoke.sh` checks the queue fields are numeric. See
  `deploy/README.md` section 1b for scaling workers and the
  `scripts/sse-soak.mjs` harness.
- `scripts/prod-smoke.sh` optionally verifies the signed-in surface when
  `SMOKE_USER` and `SMOKE_PASSWORD` are set. Use a normal non-admin account
  created through `/register`; the check logs in, verifies the bell, dashboard
  and notification APIs, logs out, and is skipped when the variables are unset.
- Container logs are JSON with 10 MB × 3 rotation.
- Watch worker failures, queue depth (`pauoj-judge`), disk space for Docker
  images and judge workdirs, and PostgreSQL connection counts.
- Consider adding Sentry/OpenTelemetry; the logger already emits structured
  JSON.

## Security checklist

- Change all default passwords before exposing the app.
- Keep `SEED_DEMO_DATA=false` in production.
- Do not publish PostgreSQL or Redis ports. The Compose file binds them to
  loopback only; remove those mappings entirely if not needed on the host.
- Restrict Docker socket access. Use a dedicated worker host, rootless Docker,
  or gVisor/Kata for stronger isolation.
- Keep the judge image rebuilt when compiler/security updates are needed.
- Use HTTPS and HSTS.
- Run `pnpm audit --prod` and update dependencies regularly.
- Limit worker concurrency to available CPU/memory; each job uses one CPU and up
  to the container memory limit.
- Add rate limiting/WAF at the proxy if the judge is public.
- Uploads are limited to avatars (1 MiB) and DM images (5 MiB file, 6 MiB
  total body preflighted before multipart parsing); both are stored as `bytea`
  in Postgres, so no upload directory is ever mounted. Caddy must allow an 8 MB
  request body (`request_body { max_size 8MB }` in the Compose Caddyfile and
  the shared-host site block). Per-sender DM image quotas are 50 images per
  rolling 24 hours and 250 MiB stored. Every deploy checks a 5 MiB body end to
  end with `deploy/check-upload-limit.sh` and fails if the probe does not get
  `401`/`422` (including `413`).

## Updating

1. Pull the new code / build a new image.
2. Run migrations through the app startup or `node dist/migrate.js`.
3. Rebuild the judge image if language/toolchain versions changed.
4. Restart app and worker.
5. Verify `/health`, a sample accepted submission, and a contest page.

Keep migrations backward compatible so a rollback of the app image is safe.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Worker exits: Docker unavailable | `/var/run/docker.sock` is mounted and accessible; the app image contains the Docker CLI |
| Worker exits: image not found | `docker build -t pauoj/judge:latest judge` |
| Submissions stay queued | Worker logs, Redis connection, queue name `pauoj-judge` |
| `EADDRINUSE` on 5432/6379 | Change `POSTGRES_PORT`/`REDIS_PORT` in `.env` |
| Login succeeds then immediately logs out | `APP_URL` protocol/origin and proxy headers |
| No admin login / password lost | Set a new long `SEED_ADMIN_PASSWORD` in the deploy env, then run `node dist/reset-admin.js --confirm` through the seed profile; it resets/creates the seeded admin, revokes sessions and audits. See `deploy/README.md` §3d |
| Health 503 | `docker compose logs db redis app` |
| Announcements missing after publish | `/health` `broadcastQueue.pending` > 0: worker not draining broadcasts; check `worker` logs, then the `broadcasts` rows (`completed_at is null`) |
| Rate limits block a whole shared IP | Edge is overwriting `X-Forwarded-For` with the proxy IP (or Cloudflare's first hop is client-controlled); fix the proxy/Cloudflare rule, see `deploy/README.md` section 3c |
| `413` on DM image upload | Edge proxy `request_body { max_size }` is below 8MB; raise it to at least `8MB` and run `bash deploy/check-upload-limit.sh <base-url>` to confirm the 5 MiB body passes (`401`/`422` = pass, `413` = still blocked; the deploy fails/rolls back on any non-pass probe) |
| Java always CE/RE | public class must be named `Main` |
