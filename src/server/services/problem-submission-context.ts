import { eq } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { problems } from "@/server/db/schema";
import type { ProblemDetail } from "@/lib/types";
import { getProblemBySlug } from "./problems";

export async function getProblemForSubmission(
  problemId: string,
  userId: string | null,
  isAdmin: boolean,
): Promise<{
  problem: ProblemDetail;
  contestContext: { id: string; label: string } | null;
  assessmentContext: { id: string; label: string } | null;
}> {
  const [row] = await getDb()
    .select({ slug: problems.slug })
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);
  if (!row) throw errors.notFound("Problem not found.");
  const problem = await getProblemBySlug(row.slug, userId, isAdmin);
  if (!problem) throw errors.notFound("Problem not found.");
  return {
    problem,
    contestContext: problem.contestContext
      ? { id: problem.contestContext.id, label: problem.contestContext.label }
      : null,
    assessmentContext: problem.assessmentContext
      ? {
          id: problem.assessmentContext.id,
          label: problem.assessmentContext.label,
        }
      : null,
  };
}
