import { randomBytes, timingSafeEqual } from "node:crypto";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { ApiError, errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  assessmentParticipants,
  assessmentProblems,
  assessments,
  problems,
  submissions,
} from "@/server/db/schema";
import type {
  AssessmentDetail,
  AssessmentProblemItem,
  AssessmentParticipantInfo,
} from "@/lib/types";
import { assessmentPhase, participantExpiresAt, participantStatus } from "@/lib/assessments";

export function generateAccessCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

function codesMatch(expected: string, provided: string): boolean {
  const left = Buffer.from(expected.toUpperCase(), "utf8");
  const right = Buffer.from(provided.trim().toUpperCase(), "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function participantInfo(row: {
  startedAt: Date;
  expiresAt: Date;
  finishedAt: Date | null;
}): AssessmentParticipantInfo {
  return {
    status: participantStatus(row),
    startedAt: row.startedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  };
}

export async function getAssessmentBySlug(
  slug: string,
  userId: string | null,
  isAdmin: boolean,
): Promise<AssessmentDetail | null> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(assessments)
    .where(eq(assessments.slug, slug))
    .limit(1);
  const assessment = rows[0];
  if (!assessment) return null;
  if (!assessment.isPublished && !isAdmin) return null;

  const [participant] = userId
    ? await db
        .select()
        .from(assessmentParticipants)
        .where(
          and(
            eq(assessmentParticipants.assessmentId, assessment.id),
            eq(assessmentParticipants.userId, userId),
          ),
        )
        .limit(1)
    : [];

  const problemRows = await db
    .select({
      id: problems.id,
      label: assessmentProblems.label,
      position: assessmentProblems.position,
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
    })
    .from(assessmentProblems)
    .innerJoin(problems, eq(problems.id, assessmentProblems.problemId))
    .where(eq(assessmentProblems.assessmentId, assessment.id))
    .orderBy(asc(assessmentProblems.position));

  const [participantCountRow] = await db
    .select({ value: count() })
    .from(assessmentParticipants)
    .where(eq(assessmentParticipants.assessmentId, assessment.id));

  const showProblems = Boolean(participant) || isAdmin;
  const problemIds = problemRows.map((row) => row.id);
  const attemptRows =
    userId && problemIds.length > 0
      ? await db
          .select({
            problemId: submissions.problemId,
            status: submissions.status,
          })
          .from(submissions)
          .where(
            and(
              eq(submissions.userId, userId),
              eq(submissions.assessmentId, assessment.id),
              inArray(submissions.problemId, problemIds),
            ),
          )
      : [];
  const solved = new Set(
    attemptRows
      .filter((row) => row.status === "ACCEPTED")
      .map((row) => row.problemId),
  );
  const attempted = new Set(attemptRows.map((row) => row.problemId));

  const problemItems: AssessmentProblemItem[] = showProblems
    ? problemRows.map((row) => ({
        label: row.label,
        slug: row.slug,
        title: row.title,
        difficulty: row.difficulty,
        points: row.points,
        solvedByMe: solved.has(row.id),
        attemptedByMe: attempted.has(row.id),
      }))
    : [];

  const myPoints = problemItems
    .filter((item) => item.solvedByMe)
    .reduce((sum, item) => sum + item.points, 0);
  const info = participant ? participantInfo(participant) : null;
  const phase = assessmentPhase(assessment.startAt, assessment.endAt, now);

  return {
    id: assessment.id,
    slug: assessment.slug,
    title: assessment.title,
    description: assessment.description,
    accessCode: isAdmin ? assessment.accessCode : null,
    startAt: assessment.startAt.toISOString(),
    endAt: assessment.endAt.toISOString(),
    durationMinutes: assessment.durationMinutes,
    phase,
    joinMode: assessment.joinMode,
    isPublished: assessment.isPublished,
    participantCount: Number(participantCountRow?.value ?? 0),
    problemCount: problemRows.length,
    participant: info,
    canJoin:
      phase === "RUNNING" &&
      assessment.isPublished &&
      assessment.joinMode === "OPEN_CODE" &&
      Boolean(userId) &&
      !participant,
    canFinish: info?.status === "ACTIVE",
    isAdminPreview: isAdmin && !participant,
    problems: problemItems,
    mySolved: problemItems.filter((item) => item.solvedByMe).length,
    myPoints,
  };
}

export async function joinAssessment(
  slug: string,
  userId: string,
  code: string,
): Promise<{ startedAt: string; expiresAt: string }> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(assessments)
    .where(eq(assessments.slug, slug))
    .limit(1);
  const assessment = rows[0];
  if (!assessment || !assessment.isPublished) {
    throw errors.notFound("Assessment not found.");
  }
  const phase = assessmentPhase(assessment.startAt, assessment.endAt, now);
  if (phase === "UPCOMING") {
    throw errors.conflict("This assessment has not started yet.");
  }
  if (phase === "ENDED") {
    throw errors.conflict("This assessment has ended.");
  }
  if (assessment.joinMode === "INVITE") {
    throw new ApiError(
      "INVITE_ONLY",
      "This assessment only accepts personal invite links. Open the link you were given.",
      403,
    );
  }
  if (!codesMatch(assessment.accessCode, code)) {
    throw new ApiError(
      "INVALID_ACCESS_CODE",
      "That access code is not valid for this assessment.",
      403,
    );
  }

  const [existing] = await db
    .select()
    .from(assessmentParticipants)
    .where(
      and(
        eq(assessmentParticipants.assessmentId, assessment.id),
        eq(assessmentParticipants.userId, userId),
      ),
    )
    .limit(1);

  if (existing) {
    const status = participantStatus(existing, now);
    if (status === "FINISHED") {
      throw errors.conflict("You have already finished this assessment.");
    }
    if (status === "EXPIRED") {
      throw errors.conflict("Your assessment session has already expired.");
    }
    return {
      startedAt: existing.startedAt.toISOString(),
      expiresAt: existing.expiresAt.toISOString(),
    };
  }

  const expiresAt = participantExpiresAt(now, assessment.durationMinutes, assessment.endAt);

  const inserted = await db
    .insert(assessmentParticipants)
    .values({
      assessmentId: assessment.id,
      userId,
      startedAt: now,
      expiresAt,
    })
    .onConflictDoNothing()
    .returning();

  const participant = inserted[0];
  if (!participant) {
    const [race] = await db
      .select()
      .from(assessmentParticipants)
      .where(
        and(
          eq(assessmentParticipants.assessmentId, assessment.id),
          eq(assessmentParticipants.userId, userId),
        ),
      )
      .limit(1);
    if (!race) throw errors.conflict("Could not start the assessment.");
    return {
      startedAt: race.startedAt.toISOString(),
      expiresAt: race.expiresAt.toISOString(),
    };
  }

  return {
    startedAt: participant.startedAt.toISOString(),
    expiresAt: participant.expiresAt.toISOString(),
  };
}

export async function finishAssessment(
  slug: string,
  userId: string,
): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(eq(assessments.slug, slug))
    .limit(1);
  const assessment = rows[0];
  if (!assessment) throw errors.notFound("Assessment not found.");

  const [participant] = await db
    .select()
    .from(assessmentParticipants)
    .where(
      and(
        eq(assessmentParticipants.assessmentId, assessment.id),
        eq(assessmentParticipants.userId, userId),
      ),
    )
    .limit(1);
  if (!participant) {
    throw errors.forbidden("You have not joined this assessment.");
  }
  if (participant.finishedAt) return;

  await db
    .update(assessmentParticipants)
    .set({ finishedAt: new Date() })
    .where(
      and(
        eq(assessmentParticipants.assessmentId, assessment.id),
        eq(assessmentParticipants.userId, userId),
      ),
    );
}
