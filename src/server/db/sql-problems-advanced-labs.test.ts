import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { SQL_PROBLEMS_ADVANCED_LABS } from "./sql-problems-advanced-labs";

const root = process.cwd();
const directory = mkdtempSync(join(tmpdir(), "sql-labs-"));

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

function runScript(script: string, setup: string) {
  const file = join(directory, `lab-${Math.random().toString(36).slice(2)}.sql`);
  writeFileSync(file, script);
  return spawnSync("python3", ["judge/sql-runner.py", file, "sql", "--script"], {
    cwd: root,
    input: setup,
    encoding: "utf8",
  });
}

describe("SQL advanced labs", () => {
  it("ships four hard, premium script-mode problems", () => {
    expect(SQL_PROBLEMS_ADVANCED_LABS).toHaveLength(4);
    expect(
      new Set(SQL_PROBLEMS_ADVANCED_LABS.map((problem) => problem.slug)).size,
    ).toBe(4);

    for (const problem of SQL_PROBLEMS_ADVANCED_LABS) {
      expect(problem.judgeLanguage).toBe("sql-script");
      expect(problem.premiumModuleSlug).toBe("advanced-sql");
      expect(problem.difficulty).toBe("HARD");
      expect(problem.points).toBe(350);
      expect(problem.tests).toHaveLength(5);
      expect(problem.tests.filter((test) => test.isSample)).toHaveLength(2);
      expect(new Set(problem.tests.map((test) => test.expectedOutput)).size)
        .toBeGreaterThanOrEqual(3);
      expect(problem.statement).toMatch(/[\u0980-\u09ff]/);
      expect(problem.referenceSql?.trim().length).toBeGreaterThan(0);
    }
  });

  for (const problem of SQL_PROBLEMS_ADVANCED_LABS) {
    it(`reproduces every ${problem.slug} test from its reference script`, () => {
      const script = problem.referenceSql ?? "";
      for (const [index, test] of problem.tests.entries()) {
        const result = runScript(script, test.input);
        expect(
          result.status,
          `${problem.slug} test ${index + 1}: ${result.stderr}`,
        ).toBe(0);
        expect(result.stdout, `${problem.slug} test ${index + 1}`).toBe(
          test.expectedOutput,
        );
      }
    }, 30_000);
  }
});
