import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  problemReferenceSolutions,
  problems,
} from "@/server/db/schema";
import type { RunCheckerType } from "@/server/judge/compare-output";
import type { JudgeLanguage } from "@/server/judge/types";

export type RunReference = {
  reference: { language: JudgeLanguage; source: string } | null;
  checkerType: RunCheckerType;
  floatTolerance: number;
};

const JUDGE_LANGUAGES = new Set<JudgeLanguage>([
  "c",
  "cpp",
  "python",
  "javascript",
  "java",
  "csharp",
  "go",
  "php",
  "kotlin",
  "swift",
  "sql",
  "sqlite",
  "mysql",
  "postgresql",
]);

function toJudgeLanguage(value: string | null): JudgeLanguage | null {
  if (!value) return null;
  return JUDGE_LANGUAGES.has(value as JudgeLanguage)
    ? (value as JudgeLanguage)
    : null;
}

/**
 * Reference solutions are only used to derive expected output for practice
 * custom runs. Callers must gate this by contest/assessment context.
 */
export async function getRunReference(
  problemId: string,
): Promise<RunReference | null> {
  const [row] = await getDb()
    .select({
      language: problemReferenceSolutions.language,
      source: problemReferenceSolutions.source,
      checkerType: problems.checkerType,
      floatTolerance: problems.floatTolerance,
    })
    .from(problems)
    .leftJoin(
      problemReferenceSolutions,
      eq(problemReferenceSolutions.problemId, problems.id),
    )
    .where(eq(problems.id, problemId))
    .limit(1);
  if (!row) return null;

  const language = toJudgeLanguage(row.language);
  return {
    reference:
      language && row.source !== null
        ? { language, source: row.source }
        : null,
    checkerType: row.checkerType,
    floatTolerance: row.floatTolerance,
  };
}
