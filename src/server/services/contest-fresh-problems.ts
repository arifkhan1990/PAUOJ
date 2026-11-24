import { and, eq, inArray, ne } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import type { Database } from "@/server/db";
import {
  contestProblemDebuts,
  contestProblems,
  problems,
} from "@/server/db/schema";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type FreshPolicyExecutor = Database | Transaction;

export type FreshProblemViolation = {
  problemId: string;
  title: string;
  reason: string;
};

/**
 * Fresh-problem policy: a fresh problem was never linked to another contest,
 * never debuted, and stays private until this contest debuts it. Debut rows are
 * permanent history (removed only with the contest), reserved in the same
 * transaction; a concurrent reservation surfaces as a unique-constraint
 * conflict (409) instead of silently sharing a problem.
 */
export async function applyFreshProblemPolicy(
  executor: FreshPolicyExecutor,
  input: { contestId: string; problemIds: string[]; requiresFresh: boolean },
): Promise<void> {
  const { contestId, problemIds, requiresFresh } = input;
  if (!requiresFresh || problemIds.length === 0) return;

  const [usedRows, debutRows, problemRows] = await Promise.all([
    executor
      .select({ problemId: contestProblems.problemId })
      .from(contestProblems)
      .where(
        and(
          inArray(contestProblems.problemId, problemIds),
          ne(contestProblems.contestId, contestId),
        ),
      ),
    executor
      .select({ problemId: contestProblemDebuts.problemId })
      .from(contestProblemDebuts)
      .where(
        and(
          inArray(contestProblemDebuts.problemId, problemIds),
          ne(contestProblemDebuts.contestId, contestId),
        ),
      ),
    executor
      .select({
        id: problems.id,
        title: problems.title,
        isPublic: problems.isPublic,
      })
      .from(problems)
      .where(inArray(problems.id, problemIds)),
  ]);

  const usedElsewhere = new Set(usedRows.map((row) => row.problemId));
  const debutedElsewhere = new Set(debutRows.map((row) => row.problemId));
  const titleById = new Map(problemRows.map((row) => [row.id, row.title]));
  const publicIds = new Set(
    problemRows.filter((row) => row.isPublic).map((row) => row.id),
  );

  const violations: FreshProblemViolation[] = [];
  for (const problemId of problemIds) {
    const title = titleById.get(problemId) ?? problemId;
    if (usedElsewhere.has(problemId)) {
      violations.push({
        problemId,
        title,
        reason: "already used in another contest",
      });
    } else if (debutedElsewhere.has(problemId)) {
      violations.push({
        problemId,
        title,
        reason: "already debuted in another contest",
      });
    } else if (publicIds.has(problemId)) {
      violations.push({
        problemId,
        title,
        reason: "must stay private until this contest debuts it",
      });
    }
  }

  if (violations.length > 0) {
    throw errors.validation(
      "These problems are not fresh. Pick problems that never appeared in another contest, never debuted, and stay private until this round.",
      { problems: violations },
    );
  }

  const ownDebutRows = await executor
    .select({ problemId: contestProblemDebuts.problemId })
    .from(contestProblemDebuts)
    .where(
      and(
        inArray(contestProblemDebuts.problemId, problemIds),
        eq(contestProblemDebuts.contestId, contestId),
      ),
    );
  const alreadyDebuted = new Set(ownDebutRows.map((row) => row.problemId));
  const newDebuts = problemIds.filter((id) => !alreadyDebuted.has(id));
  if (newDebuts.length === 0) return;

  await executor
    .insert(contestProblemDebuts)
    .values(newDebuts.map((problemId) => ({ problemId, contestId })));
}
