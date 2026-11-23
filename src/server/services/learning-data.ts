import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { problems, submissions } from "@/server/db/schema";
import type {
  LearningProblemRow,
  LearningSolvedFlags,
} from "@/lib/learning/progress";

export async function loadProblems(
  slugs: string[],
): Promise<Map<string, LearningProblemRow>> {
  if (slugs.length === 0) return new Map();
  const rows = await getDb()
    .select({
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
    })
    .from(problems)
    .where(inArray(problems.slug, slugs));
  return new Map(rows.map((row) => [row.slug, row]));
}

export async function loadSolvedFlags(
  userId: string | null,
  slugs: string[],
): Promise<LearningSolvedFlags> {
  const flags: LearningSolvedFlags = { solved: new Set(), attempted: new Set() };
  if (!userId || slugs.length === 0) return flags;
  const rows = await getDb()
    .select({ slug: problems.slug, status: submissions.status })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .where(
      and(
        eq(submissions.userId, userId),
        isNull(submissions.assessmentId),
        inArray(problems.slug, slugs),
      ),
    )
    .groupBy(problems.slug, submissions.status);
  for (const row of rows) {
    flags.attempted.add(row.slug);
    if (row.status === "ACCEPTED") flags.solved.add(row.slug);
  }
  return flags;
}
