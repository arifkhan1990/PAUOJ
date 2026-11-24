import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

/**
 * These tests exercise the real database servers inside the judge image. They
 * are opt-in because the default unit suite must not require Docker:
 *   RUN_SQL_ENGINE_TESTS=1 pnpm test sql-engines
 */
const image = process.env.JUDGE_IMAGE ?? "pauoj/judge:latest";
const directory = mkdtempSync(join(tmpdir(), "sql-engines-"));

function hasImage(): boolean {
  try {
    execFileSync("docker", ["image", "inspect", image], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const enabled = process.env.RUN_SQL_ENGINE_TESTS === "1" && hasImage();

type Engine = "sqlite" | "mysql" | "postgresql";
const engines = ["sqlite", "mysql", "postgresql"] as const;

function run(engine: Engine, query: string, setup = "") {
  const name = `query-${Math.random().toString(36).slice(2)}.sql`;
  writeFileSync(join(directory, name), query);
  chmodSync(directory, 0o755);
  chmodSync(join(directory, name), 0o644);
  const command =
    engine === "sqlite"
      ? ["python3", "/sql-runner.py", `/work/${name}`, "sqlite"]
      : engine === "mysql"
        ? ["python3", "/mysql-runner.py", `/work/${name}`]
        : ["python3", "/postgres-runner.py", `/work/${name}`];
  return spawnSync(
    "docker",
    [
      "run",
      "-i",
      "--rm",
      "--user",
      "65534:65534",
      "-v",
      `${directory}:/work:ro`,
      image,
      ...command,
    ],
    { input: setup, encoding: "utf8", timeout: 60_000 },
  );
}

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe.skipIf(!enabled)("real SQL judge engines", () => {
  it.each(engines)("applies test setup and filters rows on %s", (engine) => {
    const result = run(
      engine,
      "SELECT name, city FROM vendors WHERE rating >= 4.5 ORDER BY name;",
      "update vendors set rating = 4.0 where id = 1;",
    );
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toBe("HomeCraft\tKhulna\nStyleHub\tDhaka");
  });

  it("returns identical rows from SQLite, MariaDB and PostgreSQL", () => {
    const query =
      "SELECT pv.sku, CAST(julianday('2026-11-15') - julianday('2026-10-01') AS INTEGER) AS days, json_extract(pa.attributes, '$.brand') AS brand FROM product_variants pv JOIN product_attributes pa ON pa.product_id = pv.product_id WHERE pv.sku GLOB 'MON-*' ORDER BY pv.sku;";
    const outputs = engines.map((engine) => {
      const result = run(engine, query);
      expect(result.status, `${engine}: ${result.stderr}`).toBe(0);
      return result.stdout;
    });
    expect(outputs[0]).toBe(
      "MON-27-BLK\t45\tSamsung\nMON-32-BLK\t45\tSamsung",
    );
    expect(outputs[1]).toBe(outputs[0]);
    expect(outputs[2]).toBe(outputs[0]);
  });

  it.each(engines)("keeps the database read-only on %s", (engine) => {
    const write = run(engine, "DELETE FROM vendors;");
    expect(write.status).not.toBe(0);

    const multiple = run(engine, "SELECT 1; DROP TABLE vendors;");
    expect(multiple.status).not.toBe(0);
  });
});
