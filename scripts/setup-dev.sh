#!/usr/bin/env bash
# One-time local setup: dependencies, Postgres, Redis, migrations, seed and judge image.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

pnpm install
docker compose up -d --wait db redis
pnpm db:migrate
pnpm db:seed
docker build -t pauoj/judge:latest judge

echo
echo "Setup complete."
echo "Start the app:    pnpm dev"
echo "Start the judge:  pnpm worker:start"
