/**
 * Postgres fixtures and cleanup verification for the study-plan E2E.
 * Uses the `postgres` package that the app already depends on; DATABASE_URL is
 * required and CI sets it to the job's Postgres service.
 */
import postgres from "postgres";
import { assert, state } from "./shared.mjs";

export async function openDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required for the study-plan E2E");
  if (!/^postgres(ql)?:\/\//.test(url)) throw new Error("DATABASE_URL must be a postgres:// connection string");
  try {
    state.sql = postgres(url, { max: 2, onnotice: () => {} });
    await state.sql`select 1`;
  } catch (error) {
    const client = state.sql;
    state.sql = null;
    try { await client?.end({ timeout: 1 }); } catch { /* the client never connected */ }
    throw new Error(`cannot use DATABASE_URL: ${error.message}`);
  }
}

/** A published problem the user has not solved, so the private plan is not complete. */
export async function pickProblem(userId) {
  const [problem] = await state.sql`
    select p.id, p.slug, p.title from problems p
    where p.is_public and p.publication_status = 'PUBLISHED'
      and not exists (select 1 from submissions s
        where s.user_id = ${userId} and s.problem_id = p.id and s.status = 'ACCEPTED')
    order by p.slug limit 1`;
  if (problem) return problem;
  const [fallback] = await state.sql`
    select id, slug, title from problems where is_public and publication_status = 'PUBLISHED' limit 1`;
  assert(fallback, "seeded database has no published problem for the private plan fixture");
  return fallback;
}

/** Global study-plan totals plus rows still referencing the temporary list ids. */
export async function dbSnapshot(listIds) {
  const [totals] = await state.sql`
    select (select count(*)::int from study_lists) as plans,
      (select count(*)::int from study_list_sections) as sections, (select count(*)::int from study_list_items) as items,
      (select count(*)::int from study_list_enrollments) as enrollments, (select count(*)::int from study_list_item_notes) as notes`;
  let temp = { plans: 0, sections: 0, items: 0, enrollments: 0, notes: 0 };
  if (listIds.length > 0) {
    [temp] = await state.sql`
      select (select count(*)::int from study_lists where id = any(${listIds}::uuid[])) as plans,
        (select count(*)::int from study_list_sections where list_id = any(${listIds}::uuid[])) as sections,
        (select count(*)::int from study_list_items where list_id = any(${listIds}::uuid[])) as items,
        (select count(*)::int from study_list_enrollments where list_id = any(${listIds}::uuid[])) as enrollments,
        (select count(*)::int from study_list_item_notes where list_id = any(${listIds}::uuid[])) as notes`;
  }
  return { totals, temp };
}
