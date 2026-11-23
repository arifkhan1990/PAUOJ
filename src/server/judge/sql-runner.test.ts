import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const directory = mkdtempSync(join(tmpdir(), "sql-runner-"));

function run(query: string, dialect = "sql", setup = "") {
  const file = join(directory, `query-${Math.random().toString(36).slice(2)}.sql`);
  writeFileSync(file, query);
  return spawnSync("python3", ["judge/sql-runner.py", file, dialect], {
    cwd: root,
    input: setup,
    encoding: "utf8",
  });
}

describe("SQL judge runner", () => {
  it("casts parenthesized and extracted expressions", () => {
    const simple = run(
      "SELECT (price_cents / 100)::numeric AS a, ROUND(rating, 2)::text AS b FROM products WHERE id = 5;",
      "postgresql",
    );
    expect(simple.status).toBe(0);
    expect(simple.stdout).toBe("950\t4.5");

    const extracted = run(
      "SELECT EXTRACT(YEAR FROM ordered_at)::text FROM orders ORDER BY id LIMIT 1;",
      "postgresql",
    );
    expect(extracted.status).toBe(0);
    expect(extracted.stdout).toBe("2026");
  });

  it("strips identifier backticks but preserves string literals", () => {
    const result = run(
      "SELECT 'a`b' AS literal, `name` FROM vendors ORDER BY id LIMIT 1;",
      "mysql",
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("a`b\tTechNest");
  });

  it("rejects writes and multiple statements", () => {
    expect(run("DELETE FROM vendors;").status).not.toBe(0);
    expect(run("SELECT 1; DROP TABLE vendors;").status).not.toBe(0);
  });
});
