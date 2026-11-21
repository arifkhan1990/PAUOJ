import { describe, expect, it } from "vitest";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { practiceSubmissionCondition } from "./submission-filters";

const dialect = new PgDialect();

function render(condition: SQL): string {
  return dialect.sqlToQuery(condition).sql;
}

describe("practiceSubmissionCondition", () => {
  it("excludes assessment and virtual-contest submissions", () => {
    const rendered = render(practiceSubmissionCondition());
    expect(rendered).toContain('"submissions"."assessment_id" is null');
    expect(rendered).toContain('"submissions"."virtual_contest_id" is null');
  });
});
