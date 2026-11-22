import { readFileSync } from "node:fs";
import path from "node:path";
import { getSql } from "@/server/db";

export type MigrationStatus = {
  applied: number;
  expected: number;
  ok: boolean;
};

/**
 * Compares the drizzle journal shipped with the image against the migrations
 * recorded in the database. Returns null when the check cannot run (for example
 * a slim image without the drizzle folder), so it never blocks health by itself.
 */
export async function getMigrationStatus(): Promise<MigrationStatus | null> {
  try {
    const journalPath = path.join(
      process.cwd(),
      "drizzle",
      "meta",
      "_journal.json",
    );
    const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
      entries?: unknown[];
    };
    const expected = Array.isArray(journal.entries) ? journal.entries.length : 0;
    if (expected === 0) return null;

    const rows = (await getSql()`
      select count(*)::int as applied
      from drizzle.__drizzle_migrations
    `) as Array<{ applied: number }>;
    const applied = Number(rows[0]?.applied ?? 0);

    return { applied, expected, ok: applied >= expected };
  } catch {
    return null;
  }
}
