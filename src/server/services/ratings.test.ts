import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { contests } from "@/server/db/schema";
import { dueRatingContestCondition } from "./rating-sweep";
import { earlierUnfinalizedContestCondition } from "./ratings";

const dialect = new PgDialect();
const NOW = new Date("2026-11-25T12:00:00.000Z");
const CUTOFF_MS = NOW.getTime() - 60 * 60 * 1000;

function compile() {
  const condition = dueRatingContestCondition(NOW);
  return dialect.sqlToQuery(sql`select 1 from ${contests} where ${condition}`);
}

describe("dueRatingContestCondition", () => {
  it("requires unrated contests whose review window has closed", () => {
    const query = compile();
    expect(query.sql).toContain('"contests"."rated_at" is null');
    expect(query.sql).toContain('"contests"."end_at" <=');
    expect(
      query.params.some((param) => {
        if (param instanceof Date) return param.getTime() === CUTOFF_MS;
        return param === new Date(CUTOFF_MS).toISOString();
      }),
    ).toBe(true);
  });

  it("excludes contests with queued or judging submissions", () => {
    const query = compile();
    expect(query.sql).toContain("not exists");
    expect(query.sql).toContain(
      '"submissions"."contest_id" = "contests"."id"',
    );
    // Virtual replays never feed official ratings, so their pending jobs must
    // not hold the official sweep back.
    expect(query.sql).toContain('"submissions"."virtual_contest_id" is null');
    expect(query.sql).toContain('"submissions"."status" in');
    expect(query.params).toContain("QUEUED");
    expect(query.params).toContain("JUDGING");
  });

  it("waits for earlier-ended unfinalized contests", () => {
    const query = compile();
    // A bare alias reference without this FROM clause fails at runtime
    // ("relation earlier_contests does not exist").
    expect(query.sql).toContain('from "contests" as earlier_contests');
    expect(query.sql).toContain("earlier_contests.rated_at is null");
    expect(query.sql).toContain(
      'earlier_contests.end_at < "contests"."end_at"',
    );
    expect(query.sql).toContain(
      'earlier_contests.end_at = "contests"."end_at"',
    );
    expect(query.sql).toContain('earlier_contests.id < "contests"."id"');
    expect(query.sql.match(/not exists/g)?.length ?? 0).toBe(2);
  });
});

describe("earlierUnfinalizedContestCondition", () => {
  it("requires unrated contests ranked earlier by (end_at, id)", () => {
    const end = new Date("2026-11-25T10:00:00.000Z");
    const contestId = "00000000-0000-0000-0000-000000000002";
    const query = dialect.sqlToQuery(
      sql`select 1 from ${contests} where ${earlierUnfinalizedContestCondition(end, contestId)}`,
    );
    expect(query.sql).toContain('"contests"."rated_at" is null');
    expect(query.sql).toContain('"contests"."end_at" <');
    expect(query.sql).toContain('"contests"."end_at" =');
    expect(query.sql).toContain('"contests"."id" <');
    expect(query.params).toContain(end.toISOString());
    expect(query.params).toContain(contestId);
  });
});
