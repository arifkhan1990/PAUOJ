import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  assessmentInvites,
  assessmentParticipants,
  assessmentProblems,
  problems,
  submissions,
  type Assessment,
} from "@/server/db/schema";
import { loadOwnedAssessment } from "./assessment-invites";
import {
  assessmentResultsCsv,
  buildAssessmentExportRows,
  type AssessmentExportRow,
} from "./assessment-invite-export";

export type AssessmentResultsExport = {
  assessment: Pick<Assessment, "slug" | "title" | "joinMode">;
  rows: AssessmentExportRow[];
  csv: string;
};

/**
 * Owner-scoped export assembly. `ownerId` is enforced here, not only in the
 * route: another teacher's assessment is a 404 even if the route forgets.
 */
export async function exportAssessmentResults(
  assessmentId: string,
  ownerId?: string,
  now: Date = new Date(),
): Promise<AssessmentResultsExport> {
  const assessment = await loadOwnedAssessment(assessmentId, ownerId);
  const db = getDb();

  const [invites, participants, problemRows, submissionRows] = await Promise.all([
    db
      .select()
      .from(assessmentInvites)
      .where(eq(assessmentInvites.assessmentId, assessmentId)),
    db
      .select()
      .from(assessmentParticipants)
      .where(eq(assessmentParticipants.assessmentId, assessmentId)),
    db
      .select({
        problemId: assessmentProblems.problemId,
        points: problems.points,
      })
      .from(assessmentProblems)
      .innerJoin(problems, eq(problems.id, assessmentProblems.problemId))
      .where(eq(assessmentProblems.assessmentId, assessmentId)),
    db
      .select({
        userId: submissions.userId,
        problemId: submissions.problemId,
        status: submissions.status,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .where(eq(submissions.assessmentId, assessmentId)),
  ]);

  const problemPoints = new Map(
    problemRows.map((row) => [row.problemId, row.points]),
  );
  const rows = buildAssessmentExportRows({
    invites,
    participants,
    submissions: submissionRows,
    problemPoints,
    now,
  });

  return {
    assessment: {
      slug: assessment.slug,
      title: assessment.title,
      joinMode: assessment.joinMode,
    },
    rows,
    csv: assessmentResultsCsv(rows),
  };
}
