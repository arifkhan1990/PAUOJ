import { and, asc, eq, gt, inArray, isNull, lte } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  assessmentParticipants,
  assessmentProblems,
  assessments,
} from "@/server/db/schema";
import { assessmentPhase, participantStatus } from "@/lib/assessments";

export type ActiveAssessmentContext = {
  assessmentId: string;
  slug: string;
  title: string;
  label: string;
  startAt: Date;
  endAt: Date;
  expiresAt: Date | null;
};

export async function getActiveAssessmentForProblem(
  problemId: string,
  userId: string | null,
  isAdmin: boolean,
): Promise<{
  active: ActiveAssessmentContext | null;
  restricted: boolean;
  blockingAssessment: { slug: string; title: string } | null;
}> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({
      assessmentId: assessments.id,
      slug: assessments.slug,
      title: assessments.title,
      label: assessmentProblems.label,
      startAt: assessments.startAt,
      endAt: assessments.endAt,
    })
    .from(assessmentProblems)
    .innerJoin(assessments, eq(assessments.id, assessmentProblems.assessmentId))
    .where(
      and(
        eq(assessmentProblems.problemId, problemId),
        eq(assessments.isPublished, true),
        lte(assessments.startAt, now),
        gt(assessments.endAt, now),
      ),
    )
    .orderBy(asc(assessments.startAt));

  if (rows.length === 0) {
    return { active: null, restricted: false, blockingAssessment: null };
  }
  if (isAdmin) {
    const first = rows[0];
    if (!first) {
      return { active: null, restricted: false, blockingAssessment: null };
    }
    return {
      active: {
        assessmentId: first.assessmentId,
        slug: first.slug,
        title: first.title,
        label: first.label,
        startAt: first.startAt,
        endAt: first.endAt,
        expiresAt: null,
      },
      restricted: false,
      blockingAssessment: null,
    };
  }
  if (userId) {
    const participantRows = await db
      .select({
        assessmentId: assessmentParticipants.assessmentId,
        expiresAt: assessmentParticipants.expiresAt,
      })
      .from(assessmentParticipants)
      .where(
        and(
          eq(assessmentParticipants.userId, userId),
          inArray(
            assessmentParticipants.assessmentId,
            rows.map((row) => row.assessmentId),
          ),
          gt(assessmentParticipants.expiresAt, now),
          isNull(assessmentParticipants.finishedAt),
        ),
      );
    const participantMap = new Map(
      participantRows.map((row) => [row.assessmentId, row.expiresAt]),
    );
    const accessible = rows.find((row) =>
      participantMap.has(row.assessmentId),
    );
    if (accessible) {
      return {
        active: {
          assessmentId: accessible.assessmentId,
          slug: accessible.slug,
          title: accessible.title,
          label: accessible.label,
          startAt: accessible.startAt,
          endAt: accessible.endAt,
          expiresAt: participantMap.get(accessible.assessmentId) ?? null,
        },
        restricted: false,
        blockingAssessment: null,
      };
    }
  }

  const blocker = rows[0];
  return {
    active: null,
    restricted: true,
    blockingAssessment: blocker
      ? { slug: blocker.slug, title: blocker.title }
      : null,
  };
}

export async function getAssessmentForSubmission(
  assessmentId: string,
  problemId: string,
  userId: string,
): Promise<{ assessmentId: string; expiresAt: Date }> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, assessmentId))
    .limit(1);
  const assessment = rows[0];
  if (!assessment || !assessment.isPublished) {
    throw errors.notFound("Assessment not found.");
  }
  if (assessmentPhase(assessment.startAt, assessment.endAt, now) !== "RUNNING") {
    throw errors.conflict("This assessment is not running.");
  }

  const [participant] = await db
    .select()
    .from(assessmentParticipants)
    .where(
      and(
        eq(assessmentParticipants.assessmentId, assessmentId),
        eq(assessmentParticipants.userId, userId),
      ),
    )
    .limit(1);
  if (!participant) {
    throw errors.forbidden("Join the assessment before submitting.");
  }
  if (participantStatus(participant, now) !== "ACTIVE") {
    throw errors.conflict("Your assessment session has ended.");
  }

  const [entry] = await db
    .select({ problemId: assessmentProblems.problemId })
    .from(assessmentProblems)
    .where(
      and(
        eq(assessmentProblems.assessmentId, assessmentId),
        eq(assessmentProblems.problemId, problemId),
      ),
    )
    .limit(1);
  if (!entry) {
    throw errors.validation("That problem is not part of this assessment.");
  }
  return { assessmentId: assessment.id, expiresAt: participant.expiresAt };
}
