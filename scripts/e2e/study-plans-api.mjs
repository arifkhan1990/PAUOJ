/* eslint-disable no-console */
/**
 * API + SSR (server-rendered HTML) checks for study plans: catalog markers,
 * completed state, private plan access, owner-only notes, quota concurrency,
 * owner delete and the final database-visible state.
 */
import {
  NOTE_MARKER, QUOTA, RUN_ID, SEEDED_PLANS, api, assert, cleanupPlans, countMatches, createPlan,
  deletePlanWithRetry, errorMessage, forgetCreated, pass, retryAfterMs, sleep, state,
} from "./shared.mjs";
import { dbSnapshot, pickProblem } from "./study-plans-db.mjs";

export async function stepGuestCatalog() {
  const lists = await api("/lists");
  assert(lists.status === 200, `guest /lists expected 200, got ${lists.status}`);
  for (const slug of SEEDED_PLANS) {
    assert(lists.text.includes(`href="/lists/${slug}"`), `guest /lists is missing ${slug}`);
  }
  pass("guest /lists is 200 and links the four seeded plans");

  const detail = await api("/lists/getting-started");
  assert(detail.status === 200, `guest /lists/getting-started expected 200, got ${detail.status}`);
  const mix = /<ul aria-label="Difficulty mix"[^>]*>([\s\S]*?)<\/ul>/.exec(detail.text);
  assert(mix, "getting-started is missing the Difficulty mix pills");
  assert(countMatches(mix[1], /<li\b/g) >= 3, "Difficulty mix must show Easy/Medium/Hard pills");
  assert(/aria-label="Getting started: \d+ of 4 problems solved"[\s\S]{0,800}?<svg[\s\S]{0,400}?<circle/.test(detail.text),
    "getting-started is missing the SVG progress ring");
  assert(!detail.text.includes('role="progressbar"'), "getting-started still renders role=progressbar");
  assert(!detail.text.includes("flex-grow"), "getting-started still renders a flex-grow line bar");
  pass("detail shows difficulty pills + SVG rings and no progressbar/flex-grow bars");
}

async function expectNoteSsr(cookie, slug, { has, hasNot }) {
  const page = await api(`/lists/${slug}`, { cookie });
  assert(page.status === 200, `owner /lists/${slug} expected 200, got ${page.status}`);
  for (const text of has) assert(page.text.includes(text), `SSR for owner is missing: ${text}`);
  for (const text of hasNot) assert(!page.text.includes(text), `SSR for owner still contains: ${text}`);
}

export async function stepRakibPrivatePlan(rakib, nusrat) {
  const completed = await api("/lists/getting-started", { cookie: rakib });
  assert(completed.status === 200, `rakib /lists/getting-started expected 200, got ${completed.status}`);
  assert(completed.text.includes('aria-label="Getting started: 4 of 4 problems solved"'), "rakib should see 4 of 4 solved");
  assert(completed.text.includes("Review sections"), "completed plan is missing Review sections");
  assert(!completed.text.includes("Start plan") && !completed.text.includes("Next up"),
    "completed plan still shows Start plan or the completion strip");
  pass("rakib sees the completed state (Review sections, no Start plan, no strip)");

  const problem = await pickProblem(state.users.rakib);
  const slug = `${RUN_ID}-rakib`;
  const createdPlan = await createPlan(rakib, slug, problem.id);
  assert(createdPlan.status === 201, `create private plan expected 201, got ${createdPlan.status}: ${errorMessage(createdPlan)}`);
  assert(createdPlan.json?.data?.slug === slug, "create private plan returned a different slug");
  state.created.rakib.push(slug);
  state.createdIds.rakib.push(createdPlan.json.data.id);

  const owner = await api(`/lists/${slug}`, { cookie: rakib });
  assert(owner.status === 200, `owner page expected 200, got ${owner.status}`);
  assert(owner.text.includes("Private"), "private plan page is missing the Private badge");
  assert(countMatches(owner.text, /<section id="section-/g) === 1, "private plan should render 1 section");
  assert(countMatches(owner.text, /aria-label="Add a private note for /g) === 1, "private plan should render 1 note action");
  pass(`owner opens the private plan /lists/${slug} (200, 1 section, note action)`);

  for (const [label, cookie] of [["nusrat", nusrat], ["guest", undefined]]) {
    const denied = await api(`/lists/${slug}`, { cookie });
    assert(denied.status === 404, `${label} should get 404 for a private plan, got ${denied.status}`);
  }
  pass("nusrat and guests get a real 404 for the private plan");

  const notePath = `/api/v1/lists/${slug}/notes/${problem.slug}`;
  const noteV1 = `${NOTE_MARKER} v1`;
  const noteV2 = `${NOTE_MARKER} v2`;
  const save = await api(notePath, { method: "PUT", cookie: rakib, body: { body: noteV1 } });
  assert(save.status === 200 && save.json?.data?.note === noteV1, `add note failed (${save.status})`);
  await expectNoteSsr(rakib, slug, { has: [noteV1, "Your note", `aria-label="Edit note for ${problem.title}"`], hasNot: [] });

  const foreign = await api(notePath, { method: "PUT", cookie: nusrat, body: { body: "not mine" } });
  assert(foreign.status === 404, `nusrat note PUT expected 404, got ${foreign.status}`);
  const update = await api(notePath, { method: "PUT", cookie: rakib, body: { body: noteV2 } });
  assert(update.status === 200 && update.json?.data?.note === noteV2, `update note failed (${update.status})`);
  await expectNoteSsr(rakib, slug, { has: [noteV2], hasNot: [noteV1] });

  const remove = await api(notePath, { method: "DELETE", cookie: rakib });
  assert(remove.status === 200 && remove.json?.data?.note === null, `delete note failed (${remove.status})`);
  await expectNoteSsr(rakib, slug, { has: ["Add a private note for"], hasNot: [noteV1, noteV2, "Your note"] });
  pass("note add/update/delete is owner-only and reflected in SSR HTML");

  const noteV3 = `${NOTE_MARKER} v3`;
  const restore = await api(notePath, { method: "PUT", cookie: rakib, body: { body: noteV3 } });
  assert(restore.status === 200, `restore note for the browser check failed (${restore.status})`);
  return { slug, problem, note: noteV3 };
}

async function raceQuota(sadia, problemId, slugs) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const results = await Promise.all(slugs.map((slug) => createPlan(sadia, slug, problemId)));
    const accepted = results.filter((result) => result.status === 201);
    for (const result of accepted) {
      state.created.sadia.push(result.json?.data?.slug);
      state.createdIds.sadia.push(result.json?.data?.id);
    }
    const limited = results.filter((result) => result.status === 429);
    if (limited.length === 0) return results;
    await cleanupPlans("sadia", sadia, accepted.map((result) => result.json?.data?.slug));
    const wait = Math.max(...limited.map(retryAfterMs));
    console.log(`# quota race hit the request rate limit; waiting ${Math.ceil(wait / 1000)}s and retrying`);
    await sleep(wait);
  }
  throw new Error("quota race stayed rate limited after 3 attempts");
}

export async function stepQuota(sadia, problemId) {
  const slugs = Array.from({ length: 12 }, (_, index) => `${RUN_ID}-q${index}`);
  const results = await raceQuota(sadia, problemId, slugs);
  const statuses = results.reduce((bucket, result) => {
    bucket[result.status] = (bucket[result.status] ?? 0) + 1;
    return bucket;
  }, {});
  assert(statuses[201] === QUOTA,
    `expected ${QUOTA} creates to win the quota race, got ${statuses[201] ?? 0} (statuses ${JSON.stringify(statuses)}); sadia must start with 0 owned plans`);
  assert(statuses[422] === 2, `expected 2 quota rejections, got ${statuses[422] ?? 0} (statuses ${JSON.stringify(statuses)})`);
  assert(Object.keys(statuses).every((status) => status === "201" || status === "422"),
    `quota race returned unexpected statuses: ${JSON.stringify(statuses)}`);

  const accepted = results.filter((result) => result.status === 201);
  const wonSlugs = accepted.map((result) => result.json?.data?.slug);
  assert(new Set(wonSlugs).size === QUOTA, "quota race returned duplicate slugs");
  for (const result of results.filter((item) => item.status === 422)) {
    assert(errorMessage(result).includes("up to 10 study plans"), `422 was not a quota error: ${errorMessage(result)}`);
  }
  pass("12 parallel creates -> 10x201 + 2x422 quota, no 500 and no duplicate slugs");

  await cleanupPlans("sadia", sadia, wonSlugs);
  for (const slug of wonSlugs) {
    const page = await api(`/lists/${slug}`, { cookie: sadia });
    assert(page.status === 404, `deleted quota plan /lists/${slug} still resolves (${page.status})`);
  }
  const probeSlug = `${RUN_ID}-probe`;
  const probe = await createPlan(sadia, probeSlug, problemId);
  assert(probe.status === 201, `post-cleanup quota probe create expected 201, got ${probe.status}`);
  state.created.sadia.push(probeSlug);
  state.createdIds.sadia.push(probe.json?.data?.id);
  const probeDelete = await deletePlanWithRetry(sadia, probeSlug);
  assert(probeDelete.status === 200, `post-cleanup quota probe delete expected 200, got ${probeDelete.status}`);
  forgetCreated("sadia", probeSlug);
  assert((await api(`/lists/${probeSlug}`, { cookie: sadia })).status === 404, "quota probe plan still resolves");
  pass("all 10 quota plans were deleted (404) and a fresh plan can be created");
}

export async function stepOwnerDelete(rakib, nusrat, slug) {
  const deleted = await deletePlanWithRetry(rakib, slug);
  assert(deleted.status === 200 && deleted.json?.data?.deleted === true, `owner DELETE expected 200, got ${deleted.status}`);
  forgetCreated("rakib", slug);
  for (const [label, cookie] of [["owner", rakib], ["nusrat", nusrat], ["guest", undefined]]) {
    const page = await api(`/lists/${slug}`, { cookie });
    assert(page.status === 404, `${label} page after delete expected 404, got ${page.status}`);
  }
  const edit = await api(`/lists/${slug}/edit`, { cookie: rakib });
  assert(edit.status === 404, `owner edit page after delete expected 404, got ${edit.status}`);
  const repeat = await deletePlanWithRetry(rakib, slug);
  assert(repeat.status === 404, `repeated DELETE expected 404, got ${repeat.status}`);
  const note = await api(`/api/v1/lists/${slug}/notes/a-plus-b`, { method: "DELETE", cookie: rakib });
  assert(note.status === 404, `notes API on a deleted plan expected 404, got ${note.status}`);
  pass("owner delete -> 200, page/edit/notes 404, repeated delete -> 404");
}

async function finalPlanSlugs(cookie) {
  const lists = await api("/lists", { cookie });
  assert(lists.status === 200, `/lists final check expected 200, got ${lists.status}`);
  const slugs = [...lists.text.matchAll(/href="\/lists\/([a-z0-9-]+)"/g)].map((match) => match[1]);
  return [...new Set(slugs)].filter((slug) => slug !== "new").sort();
}

export async function stepFinalState(rakib) {
  for (const [label, cookie] of [["guest", undefined], ["rakib", rakib]]) {
    const slugs = await finalPlanSlugs(cookie);
    for (const slug of SEEDED_PLANS) assert(slugs.includes(slug), `${label} /lists is missing seeded plan ${slug}`);
    assert(!slugs.some((slug) => slug.startsWith("qa-e2e-")), `${label} /lists still links a temporary plan`);
  }
  pass("/lists still links the four seeded plans for guest and rakib (no temp plans left)");

  let sections = 0;
  let items = 0;
  for (const slug of SEEDED_PLANS) {
    const page = await api(`/lists/${slug}`, { cookie: rakib });
    assert(page.status === 200, `seeded plan ${slug} expected 200, got ${page.status}`);
    assert(!page.text.includes("Leave plan"), `${slug} shows Leave plan (unexpected enrollment)`);
    assert(!page.text.includes("Your note") && !page.text.includes(NOTE_MARKER), `${slug} shows a temporary note`);
    sections += countMatches(page.text, /<section id="section-/g);
    items += countMatches(page.text, /aria-label="(?:Add a private note|Edit note) for /g);
  }
  assert(sections === 13, `seeded sections = ${sections}, expected 13`);
  assert(items === 16, `seeded items = ${items}, expected 16`);

  const { totals, temp } = await dbSnapshot([...state.createdIds.rakib, ...state.createdIds.sadia]);
  assert(JSON.stringify(temp) === JSON.stringify({ plans: 0, sections: 0, items: 0, enrollments: 0, notes: 0 }),
    `temporary rows left behind: ${JSON.stringify(temp)}`);
  assert(state.baseline && JSON.stringify(totals) === JSON.stringify(state.baseline),
    `database changed from the pre-run snapshot: before ${JSON.stringify(state.baseline)}, after ${JSON.stringify(totals)}`);
  pass(`database matches the pre-run snapshot: ${totals.plans} plans / ${totals.sections} sections / ${totals.items} items / ${totals.enrollments} enrollments / ${totals.notes} notes (temp rows 0)`);
}
