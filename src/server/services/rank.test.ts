import { describe, expect, expectTypeOf, it } from "vitest";
import { and, sql, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PresenceInfo } from "@/lib/follow-types";
import type { RankRow } from "@/lib/types";
import { users } from "@/server/db/schema";
import * as schema from "@/server/db/schema";
import { countedSubmission } from "./submission-filters";
import {
  escapeLikePattern,
  rankCountryCondition,
  rankGlobalRankExpression,
  rankInstitutionCondition,
  rankSearchCondition,
  rankSolvedRangeCondition,
  rankSortOrder,
} from "./rank-filters";
import {
  buildRankedBoard,
  listRank,
  rankSolvedConditions,
  rankSubmissionAggConditions,
  rankVisibleUserCondition,
} from "./rank";

const dialect = new PgDialect();

function render(condition: SQL): string {
  return dialect.sqlToQuery(condition).sql;
}

function renderParams(condition: SQL): unknown[] {
  return dialect.sqlToQuery(condition).params;
}

/** Mirrors the ranked subquery columns: aggregates surface as SQL aliases. */
const board = {
  username: users.username,
  displayName: users.displayName,
  institution: users.institution,
  country: users.country,
  points: sql<number>`sum(${users.rating})::int`.as("points"),
  solvedCount: sql<number>`count(*)::int`.as("solved_count"),
};

describe("rank row presence contract", () => {
  it("types presence on every RankRow", () => {
    expectTypeOf<RankRow["presence"]>().toEqualTypeOf<PresenceInfo>();
  });

  it("accepts an optional viewer for presence visibility", () => {
    expectTypeOf(listRank).toBeCallableWith({ page: 1, pageSize: 10 });
    expectTypeOf(listRank).toBeCallableWith(
      { page: 1, pageSize: 10 },
      "viewer-1",
    );
    expectTypeOf(listRank).toBeCallableWith(
      { page: 1, pageSize: 10 },
      null,
    );
  });
});

describe("rank banned exclusion", () => {
  it("renders the public-visibility condition", () => {
    const condition = rankVisibleUserCondition();

    expect(render(condition)).toBe('"users"."is_banned" = $1');
    expect(renderParams(condition)).toEqual([false]);
  });

  it("applies the exclusion to the ranked board, counts and facets", () => {
    const db = drizzle.mock({ schema });
    const query = db.select().from(buildRankedBoard(db)).toSQL();

    expect(query.sql).toContain('"users"."is_banned" = ');
    expect(query.params).toContain(false);
  });
});

describe("rank assessment exclusion", () => {
  it("countedSubmission renders as `assessment_id is null`", () => {
    expect(render(countedSubmission())).toBe(
      '"submissions"."assessment_id" is null',
    );
  });

  it("buildTotals counts only accepted non-assessment, non-virtual submissions", () => {
    const rendered = render(rankSolvedConditions());
    expect(rendered).toContain('"submissions"."assessment_id" is null');
    expect(rendered).toContain('"submissions"."virtual_contest_id" is null');
    expect(rendered).toContain('"submissions"."status" = $1');
  });

  it("listRank submission aggregate excludes assessment and virtual rows", () => {
    const rendered = render(rankSubmissionAggConditions(["alice"]));
    expect(rendered).toContain('"submissions"."assessment_id" is null');
    expect(rendered).toContain('"submissions"."virtual_contest_id" is null');
    expect(rendered).toContain('"users"."username" in ($1)');
  });
});

describe("rank text search", () => {
  it("matches username, display name and institution case-insensitively", () => {
    const condition = rankSearchCondition("ada", board)!;
    const rendered = render(condition);

    expect(rendered).toContain('"users"."username" ilike $1');
    expect(rendered).toContain('"users"."display_name" ilike $2');
    expect(rendered).toContain('"users"."institution" ilike $3');
    expect(rendered).toMatch(/^\(.*\bor\b.*\)$/);
    expect(renderParams(condition)).toEqual(["%ada%", "%ada%", "%ada%"]);
  });

  it("trims the term before matching", () => {
    const condition = rankSearchCondition("  ada  ", board)!;
    expect(renderParams(condition)).toEqual(["%ada%", "%ada%", "%ada%"]);
  });

  it("escapes LIKE wildcards so they match literally", () => {
    const condition = rankSearchCondition("100%_off", board)!;
    const params = renderParams(condition);

    expect(params).toHaveLength(3);
    expect(params.every((param) => param === "%100\\%\\_off%")).toBe(true);
  });

  it("returns undefined for a blank term", () => {
    expect(rankSearchCondition(undefined, board)).toBeUndefined();
    expect(rankSearchCondition("   ", board)).toBeUndefined();
  });

  it("escapes backslashes before wildcards", () => {
    expect(escapeLikePattern("a\\b%c_d")).toBe("a\\\\b\\%c\\_d");
  });

  it("treats an unescaped percent in the pattern as a wildcard", () => {
    expect(escapeLikePattern("plain")).toBe("plain");
  });
});

describe("rank equality and range filters", () => {
  it("matches institution exactly after trimming", () => {
    const condition = rankInstitutionCondition("  PrimeAsia University ", board.institution)!;
    expect(render(condition)).toBe('"users"."institution" = $1');
    expect(renderParams(condition)).toEqual(["PrimeAsia University"]);
  });

  it("skips a blank institution filter", () => {
    expect(rankInstitutionCondition(undefined, board.institution)).toBeUndefined();
    expect(rankInstitutionCondition("  ", board.institution)).toBeUndefined();
  });

  it("matches country exactly after trimming", () => {
    const condition = rankCountryCondition(" Bangladesh ", board.country)!;
    expect(render(condition)).toBe('"users"."country" = $1');
    expect(renderParams(condition)).toEqual(["Bangladesh"]);
  });

  it("applies an inclusive solved range on the aggregated count", () => {
    const condition = rankSolvedRangeCondition(5, 9, board.solvedCount)!;
    expect(render(condition)).toBe('("solved_count" >= $1 and "solved_count" <= $2)');
    expect(renderParams(condition)).toEqual([5, 9]);
  });

  it("supports an open-ended solved range", () => {
    const minOnly = rankSolvedRangeCondition(10, undefined, board.solvedCount)!;
    const maxOnly = rankSolvedRangeCondition(undefined, 2, board.solvedCount)!;

    expect(render(minOnly)).toBe('"solved_count" >= $1');
    expect(render(maxOnly)).toBe('"solved_count" <= $1');
    expect(renderParams(minOnly)).toEqual([10]);
    expect(renderParams(maxOnly)).toEqual([2]);
  });

  it("skips the solved range when both bounds are absent", () => {
    expect(
      rankSolvedRangeCondition(undefined, undefined, board.solvedCount),
    ).toBeUndefined();
  });
});

describe("rank sort order", () => {
  it("defaults to points, then solved, then username (the global rank order)", () => {
    const rendered = rankSortOrder(undefined, board).map(render);
    expect(rendered).toEqual([
      '"points" desc',
      '"solved_count" desc',
      '"users"."username" asc',
    ]);
  });

  it("treats `points` explicitly like the default", () => {
    expect(rankSortOrder("points", board).map(render)).toEqual(
      rankSortOrder(undefined, board).map(render),
    );
  });

  it("orders `solved` by solved count, then points, then username", () => {
    expect(rankSortOrder("solved", board).map(render)).toEqual([
      '"solved_count" desc',
      '"points" desc',
      '"users"."username" asc',
    ]);
  });

  it("orders `name` by username only", () => {
    expect(rankSortOrder("name", board).map(render)).toEqual([
      '"users"."username" asc',
    ]);
  });
});

describe("global rank window", () => {
  it("numbers rows by points, solved count and username", () => {
    const expression = rankGlobalRankExpression({
      points: board.points,
      solvedCount: board.solvedCount,
      username: board.username,
    });

    expect(render(expression)).toBe(
      '(row_number() over (order by "points" desc, "solved_count" desc, "users"."username" asc))::int',
    );
  });

  it("works over plain columns too", () => {
    const expression = rankGlobalRankExpression({
      points: users.rating,
      solvedCount: users.rating,
      username: users.username,
    });

    expect(render(expression)).toBe(
      '(row_number() over (order by "users"."rating" desc, "users"."rating" desc, "users"."username" asc))::int',
    );
  });

  it("is combined outside the filter clauses so ranks are not renumbered", () => {
    const where = and(
      rankSearchCondition("ada", board)!,
      rankInstitutionCondition("PrimeAsia University", board.institution)!,
    )!;
    const rendered = render(where);
    expect(rendered).not.toContain("row_number");
  });
});
