/**
 * Run every SQL reference solution through the real judge engines.
 *
 * Requires Docker and a built judge image (`pnpm judge:build`). The default
 * engines are SQLite, MariaDB/MySQL and PostgreSQL; script labs are SQLite-only.
 * Usage: pnpm sql:check [slug-filter]
 */
import { execFileSync } from "node:child_process";
import { SQL_PROBLEMS } from "../src/server/db/sql-problems";
import { runJudge } from "../src/server/judge/engine";
import type { JudgeLanguage } from "../src/server/judge/types";

process.env.DATABASE_URL ??= "postgres://pauoj:pauoj@localhost:5432/pauoj";
process.env.JUDGE_WORK_DIR ??= "/tmp/pauoj-sql-check";

const ENGINE_LABELS: Record<string, string> = {
  sql: "sql-standard",
  sqlite: "sqlite",
  mysql: "mysql",
  postgresql: "postgresql",
};

const image = process.env.JUDGE_IMAGE ?? "pauoj/judge:latest";

function imageExists(): boolean {
  try {
    execFileSync("docker", ["image", "inspect", image], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function enginesFor(judgeLanguage: string | null): JudgeLanguage[] {
  if (judgeLanguage === "sql-script") return ["sql", "sqlite"];
  return ["sql", "sqlite", "mysql", "postgresql"];
}

const only = process.argv[2];
const problems = SQL_PROBLEMS.filter(
  (problem) =>
    (problem.judgeLanguage === "sql" ||
      problem.judgeLanguage === "sql-script") &&
    problem.referenceSql &&
    (!only || problem.slug.includes(only)),
);

if (!imageExists()) {
  process.stderr.write(
    `Judge image "${image}" is missing. Build it with: pnpm judge:build\n`,
  );
  process.exit(1);
}

const queue = problems.flatMap((problem) =>
  enginesFor(problem.judgeLanguage ?? null).map((engine) => ({ problem, engine })),
);
const concurrency = Math.max(
  1,
  Math.min(4, Number(process.env.SQL_VERIFY_CONCURRENCY ?? "2") || 2),
);
let cursor = 0;
let passed = 0;
const failures: string[] = [];
const started = Date.now();

async function runOne(item: (typeof queue)[number]): Promise<void> {
  const { problem, engine } = item;
  if (!problem.referenceSql) return;
  const outcome = await runJudge({
    language: engine,
    source: problem.referenceSql,
    timeLimitMs: Math.max(problem.timeLimitMs, 3000),
    memoryLimitMb: problem.memoryLimitMb,
    tests: problem.tests.map((test, index) => ({
      id: `${problem.slug}-${index}`,
      position: index + 1,
      input: test.input,
      expectedOutput: test.expectedOutput,
      isSample: test.isSample,
    })),
    checker: { type: "EXACT", source: null, floatTolerance: 1e-6 },
    mode: "submission",
    sqlScript: problem.judgeLanguage === "sql-script",
  });

  if (outcome.status === "ACCEPTED") {
    passed += 1;
    return;
  }

  const label = `${problem.slug} [${ENGINE_LABELS[engine] ?? engine}] ${outcome.status} ${outcome.passedTests}/${outcome.totalTests}`;
  failures.push(label);
  process.stderr.write(`FAIL ${label}\n`);
  if (outcome.compileOutput) {
    process.stderr.write(`  compile: ${outcome.compileOutput}\n`);
  }
  if (outcome.errorMessage) {
    process.stderr.write(`  error: ${outcome.errorMessage}\n`);
  }
  for (const result of outcome.results) {
    if (result.status !== "ACCEPTED") {
      process.stderr.write(
        `  test ${result.position}: ${result.status} ${result.message ?? ""}\n`,
      );
    }
  }
}

async function worker(): Promise<void> {
  while (cursor < queue.length) {
    const item = queue[cursor];
    cursor += 1;
    if (!item) return;
    await runOne(item);
  }
}

async function main(): Promise<void> {
  process.stdout.write(
    `SQL engine check: ${problems.length} problems x engines = ${queue.length} submissions (image ${image})\n`,
  );
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const seconds = Math.round((Date.now() - started) / 1000);
  process.stdout.write(
    `\nRESULT passed=${passed} failed=${failures.length} total=${queue.length} in ${seconds}s\n`,
  );
  if (failures.length) {
    process.stderr.write(`${failures.join("\n")}\n`);
    process.exitCode = 1;
  }
}

void main();
