import { describe, expect, it } from "vitest";
import { SQL_PROBLEMS } from "./sql-problems";

describe("ShopSphere SQL problems", () => {
  it("ships sixty-three free and seventy-three advanced project problems", () => {
    expect(SQL_PROBLEMS).toHaveLength(136);
    expect(new Set(SQL_PROBLEMS.map((problem) => problem.slug)).size).toBe(136);
    const advanced = SQL_PROBLEMS.filter(
      (problem) => problem.premiumModuleSlug === "advanced-sql",
    );
    expect(advanced).toHaveLength(73);
    expect(SQL_PROBLEMS.length - advanced.length).toBe(63);
    for (const problem of advanced) {
      expect(
        problem.slug.startsWith("sql-adv-") ||
          problem.slug.startsWith("sql-check-adv-") ||
          problem.slug.startsWith("sql-practice-") ||
          problem.slug.startsWith("sql-lab-"),
      ).toBe(true);
    }
  });

  it("gives every problem five tests, two samples and a SQL reference", () => {
    for (const problem of SQL_PROBLEMS) {
      expect(["sql", "sql-script"]).toContain(problem.judgeLanguage);
      expect(problem.tests).toHaveLength(5);
      expect(problem.tests.filter((test) => test.isSample)).toHaveLength(2);
      const expectedRows = new Set(
        problem.tests.map((test) => test.expectedOutput),
      );
      expect(expectedRows.size).toBeGreaterThanOrEqual(3);
      expect(problem.referenceSql?.length).toBeGreaterThan(0);
      expect(problem.referenceSql?.trim()).toMatch(
        /^(SELECT|WITH|CREATE|INSERT|BEGIN)\b/i,
      );
      if (problem.judgeLanguage === "sql") {
        expect(problem.referenceSql).toMatch(/\bORDER BY\b/i);
      }
      for (const test of problem.tests) {
        expect(test.expectedOutput.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps checkpoints in the matching level category", () => {
    const checkpoints = SQL_PROBLEMS.filter((problem) =>
      problem.slug.startsWith("sql-check-"),
    );
    expect(checkpoints).toHaveLength(6);
    for (const problem of checkpoints) {
      const advanced = problem.slug.startsWith("sql-check-adv-");
      expect(problem.premiumModuleSlug === "advanced-sql").toBe(advanced);
      expect(problem.category).toBe(advanced ? "SQL Advanced" : "SQL Basics");
    }
  });
});
