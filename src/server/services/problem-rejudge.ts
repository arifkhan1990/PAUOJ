import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  auditLogs,
  submissionResults,
  submissions,
} from "@/server/db/schema";
import { isPendingVerdict } from "@/lib/verdicts";
import { enqueueSubmissions } from "@/server/judge/queue";

export type ProblemRejudgeResult = {
  queued: number;
  failed: boolean;
};

/**
 * Requeues standalone practice submissions for a problem after its tests
 * change. Contest, virtual-contest and assessment submissions are excluded so
 * historical standings and ratings stay intact.
 */
export async function rejudgeProblemPracticeSubmissions(
  actorId: string,
  problemId: string,
): Promise<ProblemRejudgeResult> {
  const db = getDb();
  const rows = await db
    .select({ id: submissions.id, status: submissions.status })
    .from(submissions)
    .where(
      and(
        eq(submissions.problemId, problemId),
        isNull(submissions.contestId),
        isNull(submissions.virtualContestId),
        isNull(submissions.assessmentId),
      ),
    )
    .limit(500);
  const ids = rows
    .filter((row) => !isPendingVerdict(row.status))
    .map((row) => row.id);
  if (ids.length === 0) return { queued: 0, failed: false };

  await db
    .update(submissions)
    .set({
      status: "QUEUED",
      passedTests: 0,
      runtimeMs: null,
      memoryKb: null,
      compileOutput: null,
      errorMessage: null,
      judgedAt: null,
    })
    .where(inArray(submissions.id, ids));
  await db
    .delete(submissionResults)
    .where(inArray(submissionResults.submissionId, ids));

  try {
    await enqueueSubmissions(ids);
  } catch (error) {
    console.error("Could not enqueue practice rejudge", error);
    await db
      .update(submissions)
      .set({
        status: "SYSTEM_ERROR",
        errorMessage: "The judge queue is unavailable.",
        judgedAt: new Date(),
      })
      .where(inArray(submissions.id, ids));
    await db.insert(auditLogs).values({
      actorId,
      action: "submission.rejudge_batch",
      entityType: "problem",
      entityId: problemId,
      metadata: { attempted: ids.length, queued: 0, failed: true },
    });
    return { queued: 0, failed: true };
  }

  await db.insert(auditLogs).values({
    actorId,
    action: "submission.rejudge_batch",
    entityType: "problem",
    entityId: problemId,
    metadata: { attempted: ids.length, queued: ids.length, failed: false },
  });
  return { queued: ids.length, failed: false };
}
