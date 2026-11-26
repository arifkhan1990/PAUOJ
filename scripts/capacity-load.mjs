#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Dependency-free HTTP capacity check (Node >= 22, built-in fetch).
 *
 *   node scripts/capacity-load.mjs \
 *     --url https://oj.example.edu \
 *     --path '/api/v1/contests/demo-contest/standings?page=1&pageSize=100' \
 *     --path /contests/demo-contest/standings \
 *     --concurrency 200 --duration 30
 *
 * It sends GET requests only, so it is safe against a read-only standings API
 * or an SSR page. Redirects are not followed: a 3xx is counted as its own
 * status, and traffic never leaves the origin given with --url. Every request
 * must finish or abort within --timeout-ms, so an accidentally long-lived
 * endpoint (for example SSE) fails instead of hanging the run. The deadline
 * stops new requests only; requests already in flight finish (at most
 * --timeout-ms later), so their latency is real and never a fake timeout.
 *
 * Output: a compact table on stdout, then one JSON line as the last line
 * (`| tail -1 | jq .`). Exit 0 only when every response is < 500, no request
 * timed out or hit a network error, and p95 <= --max-p95-ms. Exit 1 when the
 * check fails or is interrupted; exit 2 on invalid arguments.
 *
 * Run it from a separate host, against a seeded contest, and never against
 * production during a real contest.
 */
const MAX_SAMPLES = 200_000;
const MAX_DURATION_SECONDS = 3600;

const DEFAULTS = {
  concurrency: 200,
  duration: 30,
  timeoutMs: 10000,
  maxP95Ms: 1500,
  warmup: 10,
};

const HELP = `Usage: node scripts/capacity-load.mjs --url <origin> --path <path> [options]

  --url <origin>            required, e.g. https://oj.example.edu (no path/query)
  --path <path>             required, repeatable or comma-separated; GET only
  --concurrency <n>         parallel workers (default ${DEFAULTS.concurrency})
  --duration <seconds>      measured window (default ${DEFAULTS.duration})
  --timeout-ms <ms>         per-request deadline (default ${DEFAULTS.timeoutMs})
  --max-p95-ms <ms>         p95 budget; above it the run fails (default ${DEFAULTS.maxP95Ms})
  --warmup <n>              ignored requests before measuring (default ${DEFAULTS.warmup})
  -h, --help                show this text

Examples:
  node scripts/capacity-load.mjs --url http://localhost:3000 \\
    --path '/api/v1/contests/live-round/standings?page=1&pageSize=100'
  node scripts/capacity-load.mjs --url https://oj.example.edu \\
    --path '/api/v1/contests/live-round/standings?page=1&pageSize=100,/contests/live-round/standings'`;

const state = { stopping: false, controller: new AbortController() };

function usageError(message) {
  console.error(`capacity-load: ${message}`);
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

function parsePaths(rawPaths, origin) {
  const paths = [];
  for (const raw of rawPaths) {
    for (const part of raw.split(",")) {
      const path = part.trim();
      if (!path) usageError("--path contains an empty entry");
      if (!path.startsWith("/")) usageError(`--path must start with "/": "${path}"`);
      if (path.includes("#")) usageError(`--path must not contain a fragment: "${path}"`);
      const resolved = new URL(path, origin);
      if (resolved.origin !== origin) {
        usageError(`--path resolves outside ${origin}: "${path}"`);
      }
      if (!paths.includes(path)) paths.push(path);
    }
  }
  if (paths.length === 0) usageError("at least one --path is required");
  return paths;
}

function parseArgs(argv) {
  const options = {
    origin: null,
    rawPaths: [],
    concurrency: DEFAULTS.concurrency,
    duration: DEFAULTS.duration,
    timeoutMs: DEFAULTS.timeoutMs,
    maxP95Ms: DEFAULTS.maxP95Ms,
    warmup: DEFAULTS.warmup,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      console.log(HELP);
      process.exit(0);
    }
    if (!arg.startsWith("--")) usageError(`unexpected argument "${arg}"`);

    const separator = arg.indexOf("=");
    const flag = separator === -1 ? arg : arg.slice(0, separator);
    const inline = separator === -1 ? undefined : arg.slice(separator + 1);

    switch (flag) {
      case "--url": {
        const { value, next } = requireValue(flag, inline, argv, index);
        options.origin = value;
        index = next;
        break;
      }
      case "--path": {
        const { value, next } = requireValue(flag, inline, argv, index);
        options.rawPaths.push(value);
        index = next;
        break;
      }
      case "--concurrency":
      case "--duration":
      case "--timeout-ms":
      case "--max-p95-ms":
      case "--warmup": {
        const { value, next } = requireValue(flag, inline, argv, index);
        index = next;
        if (flag === "--duration") options.duration = numberInRange(flag, value, 0.1, MAX_DURATION_SECONDS);
        else if (flag === "--max-p95-ms") options.maxP95Ms = numberInRange(flag, value, 1, 600000);
        else if (flag === "--concurrency") options.concurrency = integer(flag, value, 1, 5000);
        else if (flag === "--timeout-ms") options.timeoutMs = integer(flag, value, 1, 600000);
        else options.warmup = integer(flag, value, 0, 1000);
        break;
      }
      default:
        usageError(`unknown option "${flag}"`);
    }
  }

  if (!options.origin) usageError("--url is required");
  if (options.rawPaths.length === 0) usageError("--path is required");

  const origin = parseOrigin(options.origin);
  const paths = parsePaths(options.rawPaths, origin);
  const targets = new Map(paths.map((path) => [path, new URL(path, origin).href]));
  return { ...options, origin, paths, targets };
}

function createStats() {
  return {
    requests: 0,
    ok: 0,
    clientErrors: 0,
    serverErrors: 0,
    networkErrors: 0,
    timeouts: 0,
    statuses: new Map(),
    samples: [],
    sampled: 0,
  };
}

// Bounded reservoir so a long run cannot grow memory without limit. Below the
// cap every sample is kept, so small runs are exact.
function addSample(stats, ms) {
  stats.sampled += 1;
  if (stats.samples.length < MAX_SAMPLES) {
    stats.samples.push(ms);
    return;
  }
  const slot = Math.floor(Math.random() * stats.sampled);
  if (slot < MAX_SAMPLES) stats.samples[slot] = ms;
}

function record(stats, result) {
  stats.requests += 1;
  addSample(stats, result.ms);
  if (result.error) {
    stats.networkErrors += 1;
    if (result.error === "timeout") stats.timeouts += 1;
    return;
  }
  stats.statuses.set(result.status, (stats.statuses.get(result.status) ?? 0) + 1);
  if (result.status >= 500) stats.serverErrors += 1;
  else if (result.status >= 400) stats.clientErrors += 1;
  else stats.ok += 1;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function summarise(stats) {
  const sorted = [...stats.samples].sort((a, b) => a - b);
  return {
    requests: stats.requests,
    ok: stats.ok,
    clientErrors: stats.clientErrors,
    serverErrors: stats.serverErrors,
    networkErrors: stats.networkErrors,
    timeouts: stats.timeouts,
    statuses: Object.fromEntries([...stats.statuses.entries()].sort((a, b) => a[0] - b[0])),
    latencyMs: {
      p50: Math.round(percentile(sorted, 50)),
      p95: Math.round(percentile(sorted, 95)),
      p99: Math.round(percentile(sorted, 99)),
      max: Math.round(sorted.at(-1) ?? 0),
      samples: stats.sampled,
    },
  };
}

async function requestOnce(url, timeoutMs) {
  const started = performance.now();
  try {
    const signal = AbortSignal.any([AbortSignal.timeout(timeoutMs), state.controller.signal]);
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal,
      headers: { accept: "text/html,application/json;q=0.9,*/*;q=0.8" },
    });
    // Drain the body so latency covers the full response, then release it.
    await response.arrayBuffer();
    return { status: response.status, ms: performance.now() - started, error: null };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const timeout = name === "TimeoutError" || name === "AbortError";
    return { status: null, ms: performance.now() - started, error: timeout ? "timeout" : "network" };
  }
}

async function warmup(config) {
  const failures = [];
  for (let index = 0; index < config.warmup && !state.stopping; index += 1) {
    const path = config.paths[index % config.paths.length];
    const result = await requestOnce(config.targets.get(path), config.timeoutMs);
    if (result.error || result.status >= 500) failures.push(`${path} -> ${result.error ?? result.status}`);
  }
  return failures;
}

async function runLoad(config, deadlineAt) {
  const overall = createStats();
  const perPath = new Map(config.paths.map((path) => [path, createStats()]));
  let cursor = 0;
  const startedAt = Date.now();

  const worker = async () => {
    while (!state.stopping && Date.now() < deadlineAt) {
      const path = config.paths[cursor % config.paths.length];
      cursor += 1;
      const result = await requestOnce(config.targets.get(path), config.timeoutMs);
      record(overall, result);
      record(perPath.get(path), result);
    }
  };

  await Promise.all(Array.from({ length: config.concurrency }, () => worker()));
  return { overall, perPath, elapsedMs: Math.max(1, Date.now() - startedAt) };
}

function buildReport(config, run, warmupFailures) {
  const totals = summarise(run.overall);
  const elapsedSeconds = run.elapsedMs / 1000;
  const rps = Math.round((totals.requests / elapsedSeconds) * 10) / 10;
  const failures = [];

  if (totals.requests === 0) failures.push("no request completed");
  if (totals.serverErrors > 0) failures.push(`${totals.serverErrors} response(s) with status >= 500`);
  if (totals.networkErrors > 0) {
    const timeouts = totals.timeouts > 0 ? `, ${totals.timeouts} timed out after ${config.timeoutMs}ms` : "";
    failures.push(`${totals.networkErrors} network error(s)${timeouts}`);
  }
  if (totals.latencyMs.p95 > config.maxP95Ms) {
    failures.push(`p95 ${totals.latencyMs.p95}ms exceeds the ${config.maxP95Ms}ms budget`);
  }
  if (state.stopping) failures.push("interrupted before the deadline");

  return {
    target: config.origin,
    paths: config.paths,
    concurrency: config.concurrency,
    durationSeconds: config.duration,
    elapsedSeconds: Math.round(elapsedSeconds * 10) / 10,
    timeoutMs: config.timeoutMs,
    warmup: config.warmup,
    warmupFailures,
    totals: { ...totals, rps },
    perPath: Object.fromEntries([...run.perPath.entries()].map(([path, stats]) => [path, summarise(stats)])),
    thresholds: { maxP95Ms: config.maxP95Ms },
    pass: failures.length === 0,
    failures,
  };
}

function printSummary(report) {
  const { totals, thresholds } = report;
  const statuses = Object.entries(totals.statuses)
    .map(([status, count]) => `${status}:${count.toLocaleString("en-US")}`)
    .join("  ");
  const latency = totals.latencyMs;

  console.log("# capacity check");
  console.log(`target      ${report.target}`);
  report.paths.forEach((path) => console.log(`path        ${path}`));
  console.log(
    `window      ${report.elapsedSeconds}s (target ${report.durationSeconds}s), ` +
      `concurrency ${report.concurrency}, warmup ${report.warmup}`,
  );
  console.log(
    `requests    ${totals.requests.toLocaleString("en-US")}  ok ${totals.ok.toLocaleString("en-US")}` +
      `  4xx ${totals.clientErrors.toLocaleString("en-US")}  5xx ${totals.serverErrors.toLocaleString("en-US")}` +
      `  network ${totals.networkErrors.toLocaleString("en-US")}` +
      (totals.timeouts > 0 ? ` (timeouts ${totals.timeouts.toLocaleString("en-US")})` : ""),
  );
  console.log(`status      ${statuses || "none"}`);
  console.log(`throughput  ${totals.rps.toLocaleString("en-US")} req/s`);
  console.log(
    `latency     p50 ${latency.p50}ms  p95 ${latency.p95}ms  p99 ${latency.p99}ms  max ${latency.max}ms` +
      (latency.samples > MAX_SAMPLES ? ` (sampled ${MAX_SAMPLES.toLocaleString("en-US")} of ${latency.samples.toLocaleString("en-US")})` : ""),
  );
  if (report.warmupFailures.length > 0) {
    console.log(`warmup      ${report.warmupFailures.length} failed, first: ${report.warmupFailures[0]}`);
  }
  console.log(`verdict     ${report.pass ? "PASS" : "FAIL"} (p95 budget ${thresholds.maxP95Ms}ms)`);
  for (const failure of report.failures) console.log(`  - ${failure}`);
  console.log(JSON.stringify(report));
}

process.on("SIGINT", () => {
  state.stopping = true;
  state.controller.abort();
  console.error("# interrupted: stopping after in-flight requests");
});

const config = parseArgs(process.argv.slice(2));
const warmupFailures = await warmup(config);
const deadlineAt = Date.now() + config.duration * 1000;
const run = await runLoad(config, deadlineAt);
const report = buildReport(config, run, warmupFailures);
printSummary(report);
process.exitCode = report.pass ? 0 : 1;
