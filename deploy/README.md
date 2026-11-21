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

Caddy obtains a TLS certificate automatically once DNS points at the server.
Check:

```bash
curl -fsS https://oj.example.edu/health
```

The health response must show `"status":"ok"` and `"workers":1` (or more).

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

Rollback: `docker compose --env-file /home/naba/server/pauoj/deploy/.env -f
deploy/docker-compose.shared.yml -p pauoj down` (keeps volumes), remove the
Caddy site file and reload the proxy. `deploy-shared.sh` also tags
`pauoj/app:previous` and recreates the app/worker from it if health fails. Never
stop the other product's project to free a port.

## 4. Backups

Manual backup:

```bash
sudo bash deploy/backup.sh
```

Cron runs it daily at 02:00 (from `server-setup.sh`). Files are written to
`/var/backups/pauoj/postgres` and `/var/backups/pauoj/redis`, with 14-day
retention. Copy backups off the server regularly.

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
- Review `docker compose ... logs` after every deploy.
- Test restores on a schedule; an untested backup is not a backup.
