import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const directory = mkdtempSync(join(tmpdir(), "sql-runner-"));

function run(
  query: string,
  dialect = "standard",
  setup = "",
  script = false,
) {
  const file = join(directory, `query-${Math.random().toString(36).slice(2)}.sql`);
  writeFileSync(file, query);
  const args = ["judge/sql-runner.py", file, dialect];
  if (script) args.push("--script");
  return spawnSync("python3", args, {
    cwd: root,
    input: setup,
    encoding: "utf8",
  });
}

describe("SQL judge runner", () => {
  it("casts parenthesized and extracted expressions", () => {
    const simple = run(
      "SELECT (price_cents / 100)::numeric AS a, ROUND(rating, 2)::text AS b FROM products WHERE id = 5;",
      "standard",
    );
    expect(simple.status).toBe(0);
    expect(simple.stdout).toBe("950\t4.5");

    const extracted = run(
      "SELECT EXTRACT(YEAR FROM ordered_at)::text FROM orders ORDER BY id LIMIT 1;",
      "standard",
    );
    expect(extracted.status).toBe(0);
    expect(extracted.stdout).toBe("2026");
  });

  it("strips identifier backticks but preserves string literals", () => {
    const result = run(
      "SELECT 'a`b' AS literal, `name` FROM vendors ORDER BY id LIMIT 1;",
      "standard",
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("a`b\tTechNest");
  });

  it("accepts SQLite, MySQL and PostgreSQL JSON forms", () => {
    const mysqlForm = run(
      "SELECT JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.brand')) AS brand FROM product_attributes WHERE product_id = 1;",
      "standard",
    );
    expect(mysqlForm.status).toBe(0);
    expect(mysqlForm.stdout).toBe("Logitech");

    const postgresForm = run(
      "SELECT attributes::jsonb->>'brand' AS brand FROM product_attributes WHERE product_id = 1;",
      "standard",
    );
    expect(postgresForm.status).toBe(0);
    expect(postgresForm.stdout).toBe("Logitech");

    const numeric = run(
      "SELECT attributes::jsonb->>'warranty_months' = '24' AS pg FROM product_attributes WHERE product_id = 1;",
      "standard",
    );
    expect(numeric.status).toBe(0);
    expect(numeric.stdout).toBe("1");

    const mysqlNumeric = run(
      "SELECT JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.warranty_months')) = '24' AS mysql FROM product_attributes WHERE product_id = 1;",
      "standard",
    );
    expect(mysqlNumeric.status).toBe(0);
    expect(mysqlNumeric.stdout).toBe("1");
  });

  it("rejects writes and multiple statements", () => {
    expect(run("DELETE FROM vendors;").status).not.toBe(0);
    expect(run("SELECT 1; DROP TABLE vendors;").status).not.toBe(0);
  });

  it("keeps the default mode read-only for DELETE", () => {
    const result = run("DELETE FROM vendors;");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("not authorized");
  });

  it("runs insert/update and prints only the last result statement", () => {
    const result = run(
      [
        "INSERT INTO products (id, vendor_id, category_id, name, price_cents, stock, rating)",
        "VALUES (99, 5, 8, 'Test Pot', 1000, 2, 4.0);",
        "UPDATE products SET stock = 5 WHERE id = 99;",
        "SELECT 1 AS ignored;",
        "SELECT name, stock FROM products WHERE id = 99;",
      ].join("\n"),
      "standard",
      "",
      true,
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("Test Pot\t5");
  });

  it("applies setup before the script and rolls back a transaction", () => {
    const result = run(
      [
        "BEGIN;",
        "UPDATE products SET stock = stock + 100 WHERE id = 8;",
        "UPDATE vendors SET rating = 1.0 WHERE id = 4;",
        "ROLLBACK;",
        "SELECT p.name, p.stock, v.rating",
        "FROM products p JOIN vendors v ON v.id = p.vendor_id",
        "WHERE p.id = 8;",
      ].join("\n"),
      "standard",
      "update products set stock = 10 where id = 8;",
      true,
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("Wireless Mouse\t10\t4.1");
  });

  it("denies ATTACH and PRAGMA in script mode", () => {
    const attach = run(
      "ATTACH DATABASE '/tmp/escape.db' AS stolen; SELECT 1;",
      "standard",
      "",
      true,
    );
    expect(attach.status).not.toBe(0);
    expect(attach.stderr).toContain("not authorized");

    const pragma = run(
      "PRAGMA table_info(vendors); SELECT 1;",
      "standard",
      "",
      true,
    );
    expect(pragma.status).not.toBe(0);
    expect(pragma.stderr).toContain("not authorized");
  });

  it("requires the script to end with a result statement", () => {
    const result = run("DROP TABLE reviews;", "standard", "", true);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("SELECT or EXPLAIN");
  });
});
