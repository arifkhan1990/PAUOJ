FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
ARG DOCKER_CLI_VERSION=29.1.3
RUN npm install -g pnpm@10.33.2 \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_CLI_VERSION}.tgz" \
        | tar -xz --strip-components=1 -C /usr/local/bin docker/docker \
    && chmod +x /usr/local/bin/docker \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
ENV APP_URL=http://localhost:3000
COPY . .
RUN pnpm copy:monaco && pnpm build && pnpm build:worker

FROM base AS web
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/scripts/production-server.cjs ./server.js
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/CHANGELOG.md ./CHANGELOG.md
COPY --from=builder /app/package.json ./package.json
COPY --from=deps /app/node_modules/@node-rs ./node_modules/@node-rs
EXPOSE 3000
CMD ["node", "server.js"]
