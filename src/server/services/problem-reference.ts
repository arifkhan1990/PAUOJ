import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  problemReferenceSolutions,
  problems,
} from "@/server/db/schema";
import type { RunCheckerType } from "@/server/judge/compare-output";
import type { JudgeLanguage } from "@/server/judge/types";
import { normalizeReferenceLanguage } from "./problem-reference-language";

export type RunReference = {
  reference: {
    language: JudgeLanguage;
    source: string;
    /** SQL script labs need the multi-statement runner. */
    sqlScript: boolean;
  } | null;
  checkerType: RunCheckerType;
  floatTolerance: number;
};

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
      script: problemReferenceSolutions.script,
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

  const language = normalizeReferenceLanguage(row.language);
  return {
    reference:
      language && row.source !== null
        ? { language, source: row.source, sqlScript: row.script ?? false }
        : null,
    checkerType: row.checkerType,
    floatTolerance: row.floatTolerance,
  };
}
