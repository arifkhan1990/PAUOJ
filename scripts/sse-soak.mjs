#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Dependency-free SSE soak harness (Node >= 22).
 *
 * Opens `--concurrency` long-lived connections to
 * `/api/v1/submissions/<id>/events`, holds them for `--hold` seconds, then
 * destroys everything and reports. Submission ids are read from a file (one per
 * line, blank lines and `#` comments ignored) and cycled when fewer ids than
 * connections are supplied. Public pending submissions need no cookie; pass
 * `--cookie` (raw Cookie header) for private ones.
 *
 *   node scripts/sse-soak.mjs \
 *     --url https://staging.example.edu \
 *     --ids-file /tmp/pending-ids.txt \
 *     --concurrency 10000 --hold 60
 *
 * Connections are created in batches of 100 with a short settle delay (or one
 * every `--ramp-ms` when set) so the listen backlog is not SYN-flooded; both
 * the agent and sockets use keep-alive.
 * Response bodies are never accumulated: chunks are split into lines, only
 * `event:` field names are counted, and the partial line is discarded once it
 * grows past 1 MiB. The harness proves the app tier only; the Caddy/edge proxy
 * must be soaked separately.
 *
 * Pass `--insecure` only for a staging endpoint with a self-signed certificate
 * (for example Caddy's `tls internal`); certificate verification stays on by
 * default and the report records the mode.
 *
 * Output: a compact table on stdout, then one JSON line as the last line
 * (`| tail -1 | jq .`). Exit 0 on a clean run, 1 when any connection failed to
 * open, fewer than `--concurrency` opened, an opened stream never emitted its
 * initial `update`, or any socket error/premature close occurred, 2 on invalid
 * arguments.
 */
import fs from "node:fs";
import http from "node:http";
import https from "node:https";

const MAX_CONCURRENCY = 20000;
const MAX_HOLD_SECONDS = 3600;
const BATCH_SIZE = 100;
/** Let the server accept/drain a batch before the next 100 SYNs. */
const BATCH_SETTLE_MS = 5;
const MAX_PARTIAL_LINE = 1 << 20;

const DEFAULTS = {
  concurrency: 1000,
  hold: 30,
  timeoutMs: 10000,
  rampMs: 0,
};

const HELP = `Usage: node scripts/sse-soak.mjs --url <origin> --ids-file <path> [options]

  --url <origin>            required, e.g. https://staging.example.edu (no path/query)
  --ids-file <path>         required, one submission id per line; blank lines and # comments ignored
  --concurrency <n>         simultaneous SSE connections (default ${DEFAULTS.concurrency}, max ${MAX_CONCURRENCY})
  --hold <seconds>          how long to hold the streams open (default ${DEFAULTS.hold})
  --timeout-ms <ms>         per-connection open deadline, stops at response headers (default ${DEFAULTS.timeoutMs})
  --ramp-ms <ms>            delay between connection launches (default 0 = batches of 100);
                            use ~5 for 10k to spread the ramp over ~50s
  --cookie <header>         optional raw Cookie header, for private submissions
  --insecure                skip TLS certificate verification (staging/self-signed only; off by default)
  -h, --help                show this text

Connections are opened in batches of ${BATCH_SIZE}; ids are cycled when there are fewer ids than connections.
Run it from a separate host, against a staging contest seeded with N public pending submissions.
Exit 0 = clean, 1 = failed open/undercount/no initial update/socket error, 2 = invalid arguments.

Example:
  node scripts/sse-soak.mjs --url https://staging.example.edu --ids-file /tmp/ids.txt \\
    --concurrency 10000 --hold 60`;

const state = { stopping: false, interrupted: false, wake: null };

function usageError(message) {
  console.error(`sse-soak: ${message}`);
  console.error("Try --help.");
  process.exit(2);
}

function requireValue(flag, inline, argv, index) {
  if (inline !== undefined) return { value: inline, next: index };
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    usageError(`${flag} needs a value`);
  }
  return { value, next: index + 1 };
}

function integer(flag, raw, min, max) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    usageError(`${flag} must be an integer between ${min} and ${max}, got "${raw}"`);
  }
  return value;
}

function numberInRange(flag, raw, min, max) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    usageError(`${flag} must be a number between ${min} and ${max}, got "${raw}"`);
  }
  return value;
}

function parseOrigin(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    usageError(`--url is not a valid URL: "${raw}"`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    usageError(`--url must use http or https, got "${url.protocol}"`);
  }
  if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) {
    usageError("--url must be a bare origin like https://oj.example.edu (no path, query or credentials)");
  }
  return url.origin;
}

function parseArgs(argv) {
  const options = {
    origin: null,
    idsFile: null,
    concurrency: DEFAULTS.concurrency,
    hold: DEFAULTS.hold,
    timeoutMs: DEFAULTS.timeoutMs,
    rampMs: DEFAULTS.rampMs,
    cookie: null,
    insecure: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      console.log(HELP);
      process.exit(0);
    }
    if (arg === "--insecure") { options.insecure = true; continue; }
    if (!arg.startsWith("--")) usageError(`unexpected argument "${arg}"`);

    const separator = arg.indexOf("=");
    const flag = separator === -1 ? arg : arg.slice(0, separator);
    const inline = separator === -1 ? undefined : arg.slice(separator + 1);

    switch (flag) {
      case "--url":
      case "--ids-file":
      case "--cookie": {
        const { value, next } = requireValue(flag, inline, argv, index);
        index = next;
        if (flag === "--url") options.origin = value;
        else if (flag === "--ids-file") options.idsFile = value;
        else options.cookie = value;
        break;
      }
      case "--concurrency":
      case "--hold":
      case "--timeout-ms":
      case "--ramp-ms": {
        const { value, next } = requireValue(flag, inline, argv, index);
        index = next;
        if (flag === "--concurrency") options.concurrency = integer(flag, value, 1, MAX_CONCURRENCY);
        else if (flag === "--hold") options.hold = numberInRange(flag, value, 0, MAX_HOLD_SECONDS);
        else if (flag === "--ramp-ms") options.rampMs = integer(flag, value, 0, 1000);
        else options.timeoutMs = integer(flag, value, 1, 600000);
        break;
      }
      default:
        usageError(`unknown option "${flag}"`);
    }
  }

  if (!options.origin) usageError("--url is required");
  if (!options.idsFile) usageError("--ids-file is required");

  options.origin = parseOrigin(options.origin);
  return options;
}

function loadIds(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (error) {
    usageError(`cannot read --ids-file "${file}": ${error.message}`);
  }

  const ids = [];
  const seen = new Set();
  for (const line of raw.split(/\r?\n/)) {
    const value = line.trim();
    if (!value || value.startsWith("#")) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    ids.push(value);
  }
  if (ids.length === 0) usageError(`--ids-file "${file}" has no submission ids`);
  return ids;
}

function submissionUrl(origin, id) {
  return new URL(`/api/v1/submissions/${encodeURIComponent(id)}/events`, origin);
}

function bump(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function createStats(target) {
  return {
    target,
    opened: 0,
    failed: 0,
    initialUpdates: 0,
    updates: 0,
    done: 0,
    errors: 0,
    closedEarly: 0,
    statuses: new Map(),
    lastError: null,
  };
}

function notifySettled(stats) {
  if (stats.opened + stats.failed < stats.target) return;
  const wake = state.wake;
  state.wake = null;
  wake?.();
}

function openStream(config, id, stats, active, agent, transport) {
  const request = transport.request(submissionUrl(config.origin, id), {
    method: "GET",
    agent,
    headers: {
      accept: "text/event-stream",
      "accept-encoding": "identity",
      "cache-control": "no-cache",
      "user-agent": "pauoj-sse-soak",
      ...(config.cookie ? { cookie: config.cookie } : {}),
    },
  });

  active.add(request);

  let settled = false;
  let sawUpdate = false;
  let sawDone = false;
  let partial = "";

  const settle = (opened) => {
    if (settled) return;
    settled = true;
    if (opened) stats.opened += 1;
    else stats.failed += 1;
    notifySettled(stats);
  };

  const recordError = (message) => {
    if (state.stopping) return;
    stats.errors += 1;
    if (!stats.lastError) stats.lastError = message;
  };

  const handleLine = (line) => {
    if (!line.startsWith("event:")) return;
    const name = line.slice(6).trim();
    if (name === "update") {
      stats.updates += 1;
      if (!sawUpdate) {
        sawUpdate = true;
        stats.initialUpdates += 1;
      }
    } else if (name === "done") {
      stats.done += 1;
      sawDone = true;
    }
  };

  // Only the time to response headers is bounded; after that, heartbeats keep
  // the stream alive and a socket-inactivity timeout would kill healthy idles.
  const openTimer = setTimeout(() => {
    request.destroy(new Error(`open timeout after ${config.timeoutMs}ms`));
  }, config.timeoutMs);

  request.on("response", (response) => {
    clearTimeout(openTimer);
    const status = response.statusCode ?? 0;
    bump(stats.statuses, status);

    response.on("error", (error) => {
      active.delete(request);
      recordError(error.message);
    });

    if (status < 200 || status >= 300) {
      settle(false);
      response.resume();
      return;
    }

    settle(true);
    response.setEncoding("utf8");
    response.on("data", (chunk) => {
      if (state.stopping) return;
      partial += chunk;
      let index = partial.indexOf("\n");
      while (index !== -1) {
        handleLine(partial.slice(0, index).replace(/\r$/, ""));
        partial = partial.slice(index + 1);
        index = partial.indexOf("\n");
      }
      // Bounded: a malformed stream cannot grow memory per connection.
      if (partial.length > MAX_PARTIAL_LINE) partial = "";
    });
    response.on("end", () => {
      active.delete(request);
      if (state.stopping || sawDone) return;
      stats.closedEarly += 1;
      recordError("stream closed before --hold elapsed");
    });
  });

  request.on("error", (error) => {
    clearTimeout(openTimer);
    active.delete(request);
    if (state.stopping) return;
    recordError(error.message);
    settle(false);
  });

  request.on("close", () => active.delete(request));
  request.end();
}

async function launch(config, ids, stats, active, agent, transport) {
  let launched = 0;
  while (launched < stats.target && !state.interrupted) {
    const batch = Math.min(BATCH_SIZE, stats.target - launched);
    for (let offset = 0; offset < batch; offset += 1) {
      openStream(config, ids[launched % ids.length], stats, active, agent, transport);
      launched += 1;
      if (config.rampMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, config.rampMs));
      }
    }
    if (config.rampMs === 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_SETTLE_MS));
    }
  }
}

function waitForSettled(stats) {
  if (stats.opened + stats.failed >= stats.target) return Promise.resolve();
  return new Promise((resolve) => {
    state.wake = resolve;
  });
}

function waitFor(ms) {
  if (ms <= 0 || state.interrupted) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      if (state.wake === done) state.wake = null;
      resolve();
    };
    const timer = setTimeout(done, ms);
    state.wake = done;
  });
}

function countSockets(agent) {
  let total = 0;
  for (const sockets of Object.values(agent.sockets)) total += sockets.length;
  return total;
}

function buildReport(config, stats, idCount, elapsedMs, activeSockets) {
  const failures = [];
  if (stats.failed > 0) failures.push(`${stats.failed} connection(s) failed to open`);
  if (stats.opened < stats.target) {
    failures.push(`only ${stats.opened} of ${stats.target} connection(s) opened`);
  }
  if (stats.initialUpdates < stats.opened) {
    failures.push(
      `${stats.opened - stats.initialUpdates} opened stream(s) sent no initial update event`,
    );
  }
  if (stats.errors > 0) failures.push(`${stats.errors} network/socket error(s)`);
  if (state.interrupted) failures.push("interrupted before the hold finished");

  return {
    target: config.origin,
    insecure: config.insecure,
    concurrency: config.concurrency,
    holdSeconds: config.hold,
    timeoutMs: config.timeoutMs,
    rampMs: config.rampMs,
    ids: idCount,
    opened: stats.opened,
    failed: stats.failed,
    initialUpdates: stats.initialUpdates,
    subsequentUpdates: Math.max(0, stats.updates - stats.initialUpdates),
    updates: stats.updates,
    done: stats.done,
    errors: stats.errors,
    closedEarly: stats.closedEarly,
    rssMB: Math.round((process.memoryUsage().rss / (1024 * 1024)) * 10) / 10,
    activeSockets,
    statuses: Object.fromEntries(
      [...stats.statuses.entries()].sort((a, b) => a[0] - b[0]),
    ),
    lastError: stats.lastError,
    durationSeconds: Math.round((elapsedMs / 1000) * 10) / 10,
    pass: failures.length === 0,
    failures,
  };
}

function printSummary(report) {
  console.log("# SSE soak");
  console.log(
    `target       ${report.target}  x${report.concurrency} connection(s), ${report.ids} id(s) cycled`,
  );
  console.log(
    `window       hold ${report.holdSeconds}s, ramp ${report.rampMs}ms/connection, open timeout ${report.timeoutMs}ms, elapsed ${report.durationSeconds}s${report.insecure ? " (TLS verify off)" : ""}`,
  );
  console.log(
    `connections  opened ${report.opened}  failed ${report.failed}  active-at-hold-end ${report.activeSockets}`,
  );
  console.log(
    `events       initial update ${report.initialUpdates}  subsequent ${report.subsequentUpdates}  total ${report.updates}  done ${report.done}`,
  );
  console.log(
    `errors       ${report.errors} (premature close ${report.closedEarly})` +
      (report.lastError ? `  last: ${report.lastError}` : ""),
  );
  console.log(`memory       rss ${report.rssMB} MB`);
  if (report.initialUpdates < report.opened) {
    console.log(
      `warn         ${report.opened - report.initialUpdates} opened stream(s) sent no update event; check ids, --cookie and the proxy`,
    );
  }
  console.log(`verdict      ${report.pass ? "PASS" : "FAIL"}`);
  for (const failure of report.failures) console.log(`  - ${failure}`);
  console.log(JSON.stringify(report));
}

process.on("SIGINT", () => {
  if (state.interrupted) process.exit(130);
  state.interrupted = true;
  console.error("# interrupted: draining and reporting");
  const wake = state.wake;
  state.wake = null;
  wake?.();
});

const config = parseArgs(process.argv.slice(2));
const ids = loadIds(config.idsFile);
const transport = config.origin.startsWith("https:") ? https : http;
// Default stays verifying; --insecure is for staging/self-signed certificates.
const agent = new transport.Agent({
  keepAlive: true,
  maxSockets: config.concurrency,
  ...(transport === https && config.insecure ? { rejectUnauthorized: false } : {}),
});
const stats = createStats(config.concurrency);
const active = new Set();
const startedAt = Date.now();

await launch(config, ids, stats, active, agent, transport);
await waitForSettled(stats);
if (!state.interrupted) await waitFor(config.hold * 1000);

const activeSockets = countSockets(agent);
state.stopping = true;
for (const request of active) request.destroy();
active.clear();
agent.destroy();

const report = buildReport(config, stats, ids.length, Date.now() - startedAt, activeSockets);
printSummary(report);
process.exitCode = report.pass ? 0 : 1;
// Fallback in case a keep-alive handle still holds the loop; unref'd so a
// clean drain exits naturally with exitCode.
setTimeout(() => process.exit(report.pass ? 0 : 1), 500).unref();
