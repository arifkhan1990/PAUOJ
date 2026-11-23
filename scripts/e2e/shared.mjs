/* eslint-disable no-console */
/**
 * Shared config, HTTP/auth helpers and mutable run state for the study-plan
 * E2E suite. Imported by the entry point and the api/browser/db modules.
 */
export const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "Demo@12345";
export const CHROME_BIN = process.env.CHROME_BIN ?? "google-chrome";
export const ORIGIN = BASE_URL;
export const SEEDED_PLANS = ["array-foundations", "dp-starter", "getting-started", "graph-and-dp-sprint"];
export const QUOTA = 10;
export const RUN_ID = `qa-e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const NOTE_MARKER = `e2e note ${RUN_ID}`;

export const state = {
  checks: 0,
  sessions: {},
  users: {},
  created: { rakib: [], sadia: [] },
  createdIds: { rakib: [], sadia: [] },
  chrome: null,
  sql: null,
  baseline: null,
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function pass(message) { state.checks += 1; console.log(`ok ${state.checks} - ${message}`); }
export function assert(condition, message) { if (!condition) throw new Error(message); }
export const countMatches = (text, pattern) => (text.match(pattern) ?? []).length;
export const errorMessage = (response) => response.json?.error?.message ?? response.text.slice(0, 160) ?? "no body";

export function retryAfterMs(response) {
  const seconds = Number(response.json?.error?.details?.retryAfterSeconds);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000 + 250, 65_000) : 2_000;
}

export async function api(path, { method = "GET", body, cookie } = {}) {
  const headers = { origin: ORIGIN };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = `pauoj_session=${cookie}`;
  const response = await fetch(`${BASE_URL}${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual",
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // HTML pages (SSR and the _not-found rewrite) are read as text.
  }
  const cookies = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
  return { status: response.status, text, json, session: /pauoj_session=([^;]+)/.exec(cookies.join(";"))?.[1] ?? null };
}

export async function login(username) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await api("/api/v1/auth/login", {
      method: "POST", body: { identifier: username, password: DEMO_PASSWORD },
    });
    if (response.status === 200 && response.session && response.json?.data?.id) {
      state.sessions[username] = response.session;
      state.users[username] = response.json.data.id;
      return response.session;
    }
    if (response.status === 429 && attempt < 3) {
      const wait = retryAfterMs(response);
      if (wait > 120_000) throw new Error(`login for ${username} is rate limited for ${wait / 1000}s`);
      console.log(`# login rate limited; waiting ${Math.ceil(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`login ${username} failed (${response.status}): ${errorMessage(response)}`);
  }
  throw new Error(`login ${username} failed after retries`);
}

export function planPayload(slug, problemId) {
  return {
    title: `QA e2e ${slug}`, slug,
    description: "Temporary private plan created by scripts/study-plans-e2e.mjs.",
    level: "BEGINNER", estimatedMinutes: 30,
    sections: [{ title: "Warm up", description: "One published problem.", problemIds: [problemId] }],
  };
}

export const createPlan = (cookie, slug, problemId) =>
  api("/api/v1/lists", { method: "POST", cookie, body: planPayload(slug, problemId) });
export const deletePlan = (cookie, slug) => api(`/api/v1/lists/${slug}`, { method: "DELETE", cookie });

/** Forget a slug once its delete succeeded so the final cleanup does not repeat it. */
export function forgetCreated(owner, slug) {
  state.created[owner] = state.created[owner].filter((item) => item !== slug);
}

/** DELETE retries 429 using retryAfterSeconds so cleanup survives a busy window. */
export async function deletePlanWithRetry(cookie, slug) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await deletePlan(cookie, slug);
    if (response.status !== 429) return response;
    const wait = retryAfterMs(response);
    if (wait > 120_000) return response;
    console.log(`# delete rate limited; waiting ${Math.ceil(wait / 1000)}s for /lists/${slug}`);
    await sleep(wait);
  }
  return deletePlan(cookie, slug);
}

export async function cleanupPlans(owner, cookie, slugs) {
  for (const slug of slugs) {
    const response = await deletePlanWithRetry(cookie, slug);
    assert(
      response.status === 200 || response.status === 404,
      `cleanup DELETE /lists/${slug} returned ${response.status}: ${errorMessage(response)}`,
    );
    forgetCreated(owner, slug);
  }
}
