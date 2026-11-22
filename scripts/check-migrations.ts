import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to check migrations");
  }

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
  if (expected === 0) {
    throw new Error("The drizzle journal is empty; run pnpm db:generate first");
  }

  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    const rows = (await sql`
      select count(*)::int as applied
      from drizzle.__drizzle_migrations
    `) as Array<{ applied: number }>;
    const applied = Number(rows[0]?.applied ?? 0);

    if (applied < expected) {
      console.error(
        `Database is behind: ${applied}/${expected} migrations applied. Run pnpm db:migrate before deploying.`,
      );
      process.exitCode = 1;
      return;
    }
    process.stdout.write(
      `Database migrations are current (${applied}/${expected}).\n`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("Migration check failed", error);
  process.exit(1);
});
