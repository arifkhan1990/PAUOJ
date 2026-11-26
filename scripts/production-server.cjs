#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS on
 * purpose: this file must run unbundled inside the standalone output. */
"use strict";

/**
 * Production HTTP server for the Next.js standalone build.
 *
 * The generated `.next/standalone/server.js` (and `next start`) listens with
 * Node's default backlog of 511, so a large SYN burst is dropped before the
 * app can accept it. This server runs the same Next.js programmatic API (see
 * the "custom server" guide in the Next.js docs) on a tuned http.Server:
 *
 *   listen(port, hostname, 8192)  backlog, clamped by net.core.somaxconn
 *   maxConnections   20_000       finite cap (0 would mean unlimited)
 *   keepAliveTimeout 65_000       above the 60s idle timeout of common
 *   headersTimeout   66_000      proxies so upstream pools are reused
 *
 * Response compression is intentionally not applied here: Caddy already does
 * `encode zstd gzip` at the edge (see deploy/Caddyfile), and compressing
 * twice would waste app CPU.
 *
 * The app dir is resolved as (first match wins):
 *   1. APP_DIR environment variable
 *   2. __dirname, when this file sits at the standalone root (the Docker
 *      image copies it next to `.next/` and `node_modules/` as `server.js`)
 *   3. <repo>/.next/standalone when started from the repo via
 *      `pnpm start:standalone`
 *
 * Like the generated standalone server.js, the serialized build config is
 * injected through process.env.__NEXT_PRIVATE_STANDALONE_CONFIG so Next
 * never looks for next.config.ts (absent from the standalone output) and
 * never loads the untraced webpack hook files.
 */

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const BACKLOG = 8192;
const MAX_CONNECTIONS = 20_000;
const KEEP_ALIVE_TIMEOUT_MS = 65_000;
const HEADERS_TIMEOUT_MS = 66_000;
const SHUTDOWN_GRACE_MS = 10_000;
const DEFAULT_PORT = 3000;
const DEFAULT_HOSTNAME = "0.0.0.0";

function log(message) {
  process.stdout.write(`[production-server] ${message}\n`);
}

function fail(message) {
  process.stderr.write(`[production-server] ${message}\n`);
  process.exit(1);
}

/** Resolve the Next.js app dir; see the header comment for the order. */
function resolveAppDir(envDir, scriptDir, exists = fs.existsSync) {
  if (envDir) {
    return path.resolve(envDir);
  }
  if (exists(path.join(scriptDir, ".next"))) {
    return scriptDir;
  }
  return path.resolve(scriptDir, "..", ".next", "standalone");
}

/** Parse PORT, defaulting to the 3000 used across the deploy stack. */
function parsePort(value, fallback = DEFAULT_PORT) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const port = Number.parseInt(String(value), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`invalid PORT "${value}"`);
  }
  return port;
}

/** Read the serialized config that `next build` wrote for this build. */
function loadStandaloneConfig(appDir) {
  const manifestPath = path.join(appDir, ".next", "required-server-files.json");
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (err) {
    throw new Error(
      `cannot read ${manifestPath} (${err.message}); run \`next build\` with output: "standalone" first`,
    );
  }
  if (!manifest || typeof manifest !== "object" || !manifest.config) {
    throw new Error(`${manifestPath} is missing its "config" field`);
  }
  return manifest.config;
}

/** Create the tuned http.Server and wire the Next.js request handler. */
function createTunedServer(handle) {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      log(`request failed for ${req.url}: ${err?.message ?? err}`);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end();
      } else {
        res.destroy();
      }
    });
  });
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;
  server.maxConnections = MAX_CONNECTIONS;
  return server;
}

/** SIGTERM/SIGINT: stop accepting, close, force-exit after the grace. */
function shutdown(server, app, signal) {
  log(`${signal} received; closing (grace ${SHUTDOWN_GRACE_MS / 1000}s)`);
  const forceExit = setTimeout(() => {
    log("grace elapsed with connections still open; forcing exit");
    process.exit(0);
  }, SHUTDOWN_GRACE_MS);
  forceExit.unref();
  server.close(() => {
    app.close().catch(() => {});
    log("closed");
    process.exit(0);
  });
}

async function main() {
  const hostname = process.env.HOSTNAME || DEFAULT_HOSTNAME;
  const port = parsePort(process.env.PORT);
  const appDir = resolveAppDir(process.env.APP_DIR, __dirname);

  if (!fs.existsSync(path.join(appDir, ".next"))) {
    fail(`no Next.js build found at ${appDir}; run \`pnpm build\` first`);
  }
  process.env.NODE_ENV = "production";
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(
    loadStandaloneConfig(appDir),
  );
  process.chdir(appDir);

  const app = require("next")({ dev: false, hostname, port, dir: appDir });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = createTunedServer(handle);
  server.on("error", (err) => fail(`server error: ${err.message}`));
  server.listen(port, hostname, BACKLOG, () => {
    log(
      `listening on http://${hostname}:${port} from ${appDir} ` +
        `(backlog ${BACKLOG} clamped by net.core.somaxconn, ` +
        `maxConnections ${MAX_CONNECTIONS}, ` +
        `keepAliveTimeout ${KEEP_ALIVE_TIMEOUT_MS}ms, ` +
        `headersTimeout ${HEADERS_TIMEOUT_MS}ms)`,
    );
  });

  let closing = false;
  const onSignal = (signal) => {
    if (closing) return;
    closing = true;
    shutdown(server, app, signal);
  };
  process.on("SIGTERM", () => onSignal("SIGTERM"));
  process.on("SIGINT", () => onSignal("SIGINT"));
}

if (require.main === module) {
  main().catch((err) => fail(err?.stack ?? String(err)));
}
