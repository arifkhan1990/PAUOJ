import "dotenv/config";
import { closeDb } from "@/server/db";
import { finalizeDueContestRatings } from "@/server/services/rating-sweep";

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseLimit(raw: string | undefined): number {
  if (!raw) return 100;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("--limit must be a positive integer");
  }
  return value;
}

function parseNow(raw: string | undefined): Date {
  if (!raw) return new Date();
  const value = new Date(raw);
  if (Number.isNaN(value.getTime())) {
    throw new Error("--now must be a valid ISO timestamp");
  }
  return value;
}

async function main(): Promise<void> {
  const limit = parseLimit(readFlag("--limit"));
  const now = parseNow(readFlag("--now"));

  const finalized: string[] = [];
  const failed: string[] = [];
  let processed = 0;

  while (processed < limit) {
    const result = await finalizeDueContestRatings(now, limit - processed);
    finalized.push(...result.finalizedSlugs);
    failed.push(...result.failedSlugs);
    const batch = result.finalized + result.failed;
    if (batch === 0) break;
    processed += batch;
  }

  process.stdout.write(`rating finalization at ${now.toISOString()}\n`);
  process.stdout.write(`finalized: ${finalized.length}\n`);
  for (const slug of finalized) process.stdout.write(`  - ${slug}\n`);
  process.stdout.write(`failed: ${failed.length}\n`);
  for (const slug of failed) process.stdout.write(`  - ${slug}\n`);

  if (failed.length > 0) process.exitCode = 1;
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: unknown) {
    process.stderr.write(
      error instanceof Error
        ? error.message
        : `finalize failed: ${String(error)}`,
    );
    process.stderr.write("\n");
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

void run();
