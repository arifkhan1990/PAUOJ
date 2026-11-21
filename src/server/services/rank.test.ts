import { describe, expect, it } from "vitest";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { countedSubmission } from "./submission-filters";
import {
  rankSolvedConditions,
  rankSubmissionAggConditions,
} from "./rank";

const dialect = new PgDialect();

function render(condition: SQL): string {
  return dialect.sqlToQuery(condition).sql;
}

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
