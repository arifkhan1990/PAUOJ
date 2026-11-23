#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Study-plan E2E smoke test entry point.
 *
 *   BASE_URL=http://localhost:3000 DATABASE_URL=postgres://... node scripts/study-plans-e2e.mjs
 *
 * Needs a running migrated+seeded app, `DATABASE_URL`, and Google Chrome
 * (CHROME_BIN, default `google-chrome`). Creates/deletes private plans and
 * notes for the demo users and always cleans up plans, notes, sessions and the
 * temp Chrome profile in `finally`. Exit 0 on success, 1 with `FAIL: ...`.
 *
 * Run serially (the demo users and Redis rate-limit keys are shared). If the
 * server was built while it was running, restart it first: stale `.next` chunks
 * make client components fail to hydrate and the note-editor CDP step fails.
 *
 * Modules: scripts/e2e/shared.mjs (config, HTTP/auth), study-plans-db.mjs
 * (Postgres fixtures/verification), study-plans-api.mjs (API+SSR checks),
 * study-plans-browser.mjs + chrome-cdp.mjs (headless Chrome/CDP).
 */
import {
  BASE_URL, CHROME_BIN, RUN_ID, api, deletePlanWithRetry, forgetCreated, login, state,
} from "./e2e/shared.mjs";
import { dbSnapshot, openDb } from "./e2e/study-plans-db.mjs";
import {
  stepFinalState, stepGuestCatalog, stepOwnerDelete, stepQuota, stepRakibPrivatePlan,
} from "./e2e/study-plans-api.mjs";
import { stepBrowser } from "./e2e/study-plans-browser.mjs";

async function cleanup() {
  const errors = [];
  if (state.chrome) {
    try { await state.chrome.close(); } catch (error) { errors.push(`browser: ${error.message}`); }
    state.chrome = null;
  }
  for (const owner of ["rakib", "sadia"]) {
    const cookie = state.sessions[owner];
    if (!cookie) continue;
    for (const slug of new Set(state.created[owner])) {
      try {
        const response = await deletePlanWithRetry(cookie, slug);
        if (response.status !== 200 && response.status !== 404) {
          errors.push(`${owner} DELETE /lists/${slug} -> ${response.status}`);
        } else {
          forgetCreated(owner, slug);
        }
      } catch (error) { errors.push(`${owner} cleanup ${slug}: ${error.message}`); }
    }
  }
  if (state.sql) {
    try {
      const { temp } = await dbSnapshot([...state.createdIds.rakib, ...state.createdIds.sadia]);
      if (Object.values(temp).some((value) => value !== 0)) {
        errors.push(`temporary DB rows left: ${JSON.stringify(temp)}`);
      }
    } catch (error) { errors.push(`DB cleanup verification: ${error.message}`); }
  }
  for (const [username, cookie] of Object.entries(state.sessions)) {
    try { await api("/api/v1/auth/logout", { method: "POST", cookie, body: {} }); }
    catch (error) { errors.push(`logout ${username}: ${error.message}`); }
  }
  if (state.sql) try { await state.sql.end({ timeout: 5 }); } catch { /* the pool is already unusable */ }
  return errors;
}

async function main() {
  console.log(`# study-plans e2e: BASE_URL=${BASE_URL} CHROME_BIN=${CHROME_BIN} run=${RUN_ID}`);
  await openDb();
  state.baseline = (await dbSnapshot([])).totals;
  console.log(`# baseline: ${JSON.stringify(state.baseline)}`);
  await stepGuestCatalog();
  const rakib = await login("rakib");
  const nusrat = await login("nusrat");
  const context = await stepRakibPrivatePlan(rakib, nusrat);
  await stepBrowser(rakib, context);
  const sadia = await login("sadia");
  await stepQuota(sadia, context.problem.id);
  await stepOwnerDelete(rakib, nusrat, context.slug);
  await stepFinalState(rakib);
}

let failure = null;
try {
  await main();
} catch (error) {
  failure = error;
}
const cleanupErrors = await cleanup();
if (!failure && cleanupErrors.length > 0) failure = new Error(`cleanup failed: ${cleanupErrors.join("; ")}`);
else if (failure && cleanupErrors.length > 0) console.error(`# cleanup also failed: ${cleanupErrors.join("; ")}`);
if (failure) {
  console.error(`FAIL: ${failure.message}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: study plans e2e (${state.checks} checks)`);
}
