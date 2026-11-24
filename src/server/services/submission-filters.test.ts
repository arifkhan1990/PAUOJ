import { describe, expect, it } from "vitest";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  languageFilterCondition,
  practiceSubmissionCondition,
  publicSubmissionCondition,
} from "./submission-filters";

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

describe("publicSubmissionCondition", () => {
  it("requires a published problem and no assessment row", () => {
    const rendered = render(
      publicSubmissionCondition(new Date("2026-11-24T12:00:00.000Z")),
    );
    expect(rendered).toContain('"problems"."is_public" =');
    expect(rendered).toContain('"submissions"."assessment_id" is null');
  });

  it("keeps standalone submissions and only ended public contests", () => {
    const rendered = render(
      publicSubmissionCondition(new Date("2026-11-24T12:00:00.000Z")),
    );
    expect(rendered).toContain('"submissions"."contest_id" is null');
    expect(rendered).toContain('"contests"."is_public" =');
    expect(rendered).toContain('"contests"."end_at" <=');
  });
});

describe("languageFilterCondition", () => {
  it("includes legacy sql rows when filtering SQLite", () => {
    const query = dialect.sqlToQuery(languageFilterCondition("sqlite"));
    expect(query.sql).toContain('"submissions"."language" in');
    expect(query.params).toEqual(["sql", "sqlite"]);
  });

  it("keeps other engines exact", () => {
    const query = dialect.sqlToQuery(languageFilterCondition("mysql"));
    expect(query.sql).toContain('"submissions"."language" in');
    expect(query.params).toEqual(["mysql"]);
  });
});
