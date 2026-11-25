import { and, asc, count, desc, eq, inArray, or, sql } from "drizzle-orm";
import { ApiError, errors } from "@/server/api/errors";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb } from "@/server/db";
import {
  assessmentParticipants,
  assessmentProblems,
  assessments,
  problems,
  submissions,
  users,
} from "@/server/db/schema";
import type { AssessmentInput } from "@/lib/schemas/assessment";
import type {
  AdminAssessmentDetail,
  AdminAssessmentListItem,
  AssessmentResults,
} from "@/lib/types";
import { participantStatus } from "@/lib/assessments";
import { slugify } from "@/lib/utils";
import { generateAccessCode } from "./assessments";

function participantCountSql() {
  return sql<number>`(select count(*)::int from assessment_participants ap where ap.assessment_id = ${assessments.id})`;
}

function problemCountSql() {
  return sql<number>`(select count(*)::int from assessment_problems ap where ap.assessment_id = ${assessments.id})`;
}

export async function listAdminAssessments(
  page: PaginationInput,
  createdBy?: string,
): Promise<{ items: AdminAssessmentListItem[]; total: number }> {
  const db = getDb();
  const where = createdBy ? eq(assessments.createdBy, createdBy) : undefined;
  const [totalRow] = await db
    .select({ value: count() })
    .from(assessments)
    .where(where);
  const rows = await db
    .select({
      id: assessments.id,
      slug: assessments.slug,
      title: assessments.title,
      accessCode: assessments.accessCode,
      startAt: assessments.startAt,
      endAt: assessments.endAt,
      durationMinutes: assessments.durationMinutes,
      isPublished: assessments.isPublished,
      participantCount: participantCountSql(),
      problemCount: problemCountSql(),
    })
    .from(assessments)
    .where(where)
    .orderBy(desc(assessments.startAt))
    .limit(page.pageSize)
    .offset(toOffset(page));

  return {
    total: Number(totalRow?.value ?? 0),
    items: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      accessCode: row.accessCode,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      durationMinutes: row.durationMinutes,
      isPublished: row.isPublished,
      participantCount: Number(row.participantCount),
      problemCount: Number(row.problemCount),
    })),
  };
}

export async function getAdminAssessmentDetail(
  id: string,
  createdBy?: string,
): Promise<AdminAssessmentDetail | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(assessments)
    .where(
      createdBy
        ? and(eq(assessments.id, id), eq(assessments.createdBy, createdBy))
        : eq(assessments.id, id),
    )
    .limit(1);
  const assessment = rows[0];
  if (!assessment) return null;
  const problemRows = await db
    .select({ problemId: assessmentProblems.problemId })
    .from(assessmentProblems)
    .where(eq(assessmentProblems.assessmentId, id))
    .orderBy(asc(assessmentProblems.position));
  return {
    id: assessment.id,
    slug: assessment.slug,
    title: assessment.title,
    description: assessment.description,
    accessCode: assessment.accessCode,
    startAt: assessment.startAt.toISOString(),
    endAt: assessment.endAt.toISOString(),
    durationMinutes: assessment.durationMinutes,
    joinMode: assessment.joinMode,
    isPublished: assessment.isPublished,
    problemIds: problemRows.map((row) => row.problemId),
  };
}

async function prepareProblems(
  problemIds: string[],
  ownerId?: string,
): Promise<string[]> {
  const unique = [...new Set(problemIds)];
  const rows = await getDb()
    .select({ id: problems.id })
    .from(problems)
    .where(
      ownerId
        ? and(
            inArray(problems.id, unique),
            or(eq(problems.isPublic, true), eq(problems.authorId, ownerId)),
          )
        : inArray(problems.id, unique),
    );
  if (rows.length !== unique.length) {
    throw errors.validation("One or more selected problems are not available.");
  }
  return unique;
}

function assessmentLinkRows(assessmentId: string, problemIds: string[]) {
  return problemIds.map((problemId, index) => ({
    assessmentId,
    problemId,
    label: String.fromCharCode(65 + index),
    position: String(index).padStart(2, "0"),
  }));
}

export async function createAssessment(
  adminId: string,
  input: AssessmentInput,
  ownerId?: string,
): Promise<AdminAssessmentDetail> {
  const db = getDb();
  const problemIds = await prepareProblems(input.problemIds, ownerId);
  const slug = input.slug || slugify(input.title);
  const accessCode = input.accessCode?.trim()
    ? input.accessCode.trim().toUpperCase()
    : generateAccessCode();
  const [existing] = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(eq(assessments.slug, slug))
    .limit(1);
  if (existing) {
    throw errors.conflict("An assessment with that slug already exists.");
  }

  const id = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(assessments)
      .values({
        slug,
        title: input.title,
        description: input.description,
        accessCode,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        durationMinutes:
          input.durationMinutes > 0 ? input.durationMinutes : null,
        joinMode: input.joinMode ?? "OPEN_CODE",
        isPublished: input.isPublished,
        createdBy: adminId,
      })
      .returning({ id: assessments.id });
    if (!created) {
      throw new ApiError("CREATE_FAILED", "Could not create assessment.", 500);
    }
    await tx
      .insert(assessmentProblems)
      .values(assessmentLinkRows(created.id, problemIds));
    return created.id;
  });

  const detail = await getAdminAssessmentDetail(id);
  if (!detail) throw new ApiError("CREATE_FAILED", "Could not load assessment.", 500);
  return detail;
}

export async function updateAssessment(
  id: string,
  input: AssessmentInput,
  createdBy?: string,
): Promise<AdminAssessmentDetail> {
  const db = getDb();
  const owned = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(
      createdBy
        ? and(eq(assessments.id, id), eq(assessments.createdBy, createdBy))
        : eq(assessments.id, id),
    )
    .limit(1);
  if (!owned[0]) throw errors.notFound("Assessment not found.");
  const problemIds = await prepareProblems(input.problemIds, createdBy);
  const slug = input.slug || slugify(input.title);
  const accessCode = input.accessCode?.trim()
    ? input.accessCode.trim().toUpperCase()
    : generateAccessCode();

  const [existing] = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(eq(assessments.slug, slug))
    .limit(1);
  if (existing && existing.id !== id) {
    throw errors.conflict("An assessment with that slug already exists.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(assessments)
      .set({
        slug,
        title: input.title,
        description: input.description,
        accessCode,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        durationMinutes:
          input.durationMinutes > 0 ? input.durationMinutes : null,
        // Only write the mode when supplied: an update without the field must
        // never reset an INVITE assessment back to OPEN_CODE.
        ...(input.joinMode ? { joinMode: input.joinMode } : {}),
        isPublished: input.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(assessments.id, id));
    await tx
      .delete(assessmentProblems)
      .where(eq(assessmentProblems.assessmentId, id));
    await tx
      .insert(assessmentProblems)
      .values(assessmentLinkRows(id, problemIds));
  });

  const detail = await getAdminAssessmentDetail(id, createdBy);
  if (!detail) throw errors.notFound("Assessment not found.");
  return detail;
}

export async function getAssessmentResults(
  id: string,
  createdBy?: string,
): Promise<AssessmentResults | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(assessments)
    .where(
      createdBy
        ? and(eq(assessments.id, id), eq(assessments.createdBy, createdBy))
        : eq(assessments.id, id),
    )
    .limit(1);
  const assessment = rows[0];
  if (!assessment) return null;

  const problemRows = await db
    .select({
      id: problems.id,
      label: assessmentProblems.label,
      title: problems.title,
      points: problems.points,
    })
    .from(assessmentProblems)
    .innerJoin(problems, eq(problems.id, assessmentProblems.problemId))
    .where(eq(assessmentProblems.assessmentId, id))
    .orderBy(asc(assessmentProblems.position));

  const participantRows = await db
    .select({
      userId: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
      startedAt: assessmentParticipants.startedAt,
      expiresAt: assessmentParticipants.expiresAt,
      finishedAt: assessmentParticipants.finishedAt,
    })
    .from(assessmentParticipants)
    .innerJoin(users, eq(users.id, assessmentParticipants.userId))
    .where(eq(assessmentParticipants.assessmentId, id));

  const submissionRows = await db
    .select({
      userId: submissions.userId,
      problemId: submissions.problemId,
      status: submissions.status,
    })
    .from(submissions)
    .where(eq(submissions.assessmentId, id));

  const labelByProblem = new Map(
    problemRows.map((problem) => [problem.id, problem.label]),
  );
  const pointsByProblem = new Map(
    problemRows.map((problem) => [problem.id, problem.points]),
  );
  const labels = problemRows.map((problem) => problem.label);
  const now = new Date();

  const resultRows = participantRows.map((participant) => {
    const cells: Record<string, { solved: boolean; attempts: number }> = {};
    for (const label of labels) {
      cells[label] = { solved: false, attempts: 0 };
    }
    let solvedCount = 0;
    let points = 0;
    let submissionCount = 0;
    for (const submission of submissionRows) {
      if (submission.userId !== participant.userId) continue;
      submissionCount += 1;
      const label = labelByProblem.get(submission.problemId);
      if (!label) continue;
      const cell = cells[label];
      if (!cell || cell.solved) continue;
      if (submission.status === "ACCEPTED") {
        cell.solved = true;
        solvedCount += 1;
        points += pointsByProblem.get(submission.problemId) ?? 0;
      } else {
        cell.attempts += 1;
      }
    }
    return {
      rank: 0,
      user: {
        username: participant.username,
        displayName: participant.displayName,
        avatarPreset: participant.avatarPreset,
        avatarImageUpdatedAt:
          participant.avatarImageUpdatedAt?.toISOString() ?? null,
      },
      status: participantStatus(participant, now),
      startedAt: participant.startedAt.toISOString(),
      expiresAt: participant.expiresAt.toISOString(),
      finishedAt: participant.finishedAt?.toISOString() ?? null,
      solved: solvedCount,
      points,
      submissions: submissionCount,
      problems: cells,
    };
  });

  resultRows.sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    if (right.solved !== left.solved) return right.solved - left.solved;
    return left.user.username.localeCompare(right.user.username);
  });
  resultRows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return {
    assessment: {
      id: assessment.id,
      slug: assessment.slug,
      title: assessment.title,
      accessCode: assessment.accessCode,
      startAt: assessment.startAt.toISOString(),
      endAt: assessment.endAt.toISOString(),
    },
    labels,
    rows: resultRows,
  };
}
