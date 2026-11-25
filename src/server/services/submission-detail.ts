import { asc, eq } from "drizzle-orm";
import type { SubmissionDetail } from "@/lib/types";
import { getDb } from "@/server/db";
import {
  assessments,
  contests,
  problems,
  submissionResults,
  submissions,
  users,
} from "@/server/db/schema";
import { getSubmissionNote } from "./submission-notes";

export async function getSubmissionById(
  id: string,
  viewer: { id: string; role: "USER" | "TEACHER" | "ADMIN" } | null,
): Promise<SubmissionDetail | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      problemId: submissions.problemId,
      status: submissions.status,
      language: submissions.language,
      sourceCode: submissions.sourceCode,
      createdAt: submissions.createdAt,
      runtimeMs: submissions.runtimeMs,
      memoryKb: submissions.memoryKb,
      passedTests: submissions.passedTests,
      totalTests: submissions.totalTests,
      compileOutput: submissions.compileOutput,
      errorMessage: submissions.errorMessage,
      judgedAt: submissions.judgedAt,
      problemSlug: problems.slug,
      problemTitle: problems.title,
      premiumModuleSlug: problems.premiumModuleSlug,
      username: users.username,
      displayName: users.displayName,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
      contestSlug: contests.slug,
      contestEndAt: contests.endAt,
      assessmentSlug: assessments.slug,
      assessmentEndAt: assessments.endAt,
    })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .innerJoin(users, eq(users.id, submissions.userId))
    .leftJoin(contests, eq(contests.id, submissions.contestId))
    .leftJoin(assessments, eq(assessments.id, submissions.assessmentId))
    .where(eq(submissions.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const isOwner = viewer?.id === row.userId;
  const isAdmin = viewer?.role === "ADMIN";
  if (row.assessmentSlug && !isOwner && !isAdmin) return null;
  const now = Date.now();
  const contestActive = row.contestEndAt
    ? row.contestEndAt.getTime() > now
    : false;
  const assessmentActive = row.assessmentEndAt
    ? row.assessmentEndAt.getTime() > now
    : false;
  const canViewSource =
    isOwner ||
    isAdmin ||
    (!row.premiumModuleSlug &&
      !row.assessmentSlug &&
      !contestActive &&
      !assessmentActive);

  const resultRows = await db
    .select({
      position: submissionResults.position,
      status: submissionResults.status,
      runtimeMs: submissionResults.runtimeMs,
      memoryKb: submissionResults.memoryKb,
      message: submissionResults.message,
    })
    .from(submissionResults)
    .where(eq(submissionResults.submissionId, id))
    .orderBy(asc(submissionResults.position));

  const note =
    isOwner && viewer ? await getSubmissionNote(id, viewer.id) : null;

  return {
    id: row.id,
    problemId: row.problemId,
    status: row.status,
    language: row.language,
    createdAt: row.createdAt.toISOString(),
    runtimeMs: row.runtimeMs,
    memoryKb: row.memoryKb,
    passedTests: row.passedTests,
    totalTests: row.totalTests,
    problem: { slug: row.problemSlug, title: row.problemTitle },
    user: {
      username: row.username,
      displayName: row.displayName,
      avatarPreset: row.avatarPreset,
      avatarImageUpdatedAt:
        row.avatarImageUpdatedAt?.toISOString() ?? null,
    },
    contestSlug: row.contestSlug,
    assessmentSlug: row.assessmentSlug,
    sourceCode: canViewSource ? row.sourceCode : null,
    compileOutput: canViewSource ? row.compileOutput : null,
    errorMessage: canViewSource ? row.errorMessage : null,
    judgedAt: row.judgedAt?.toISOString() ?? null,
    results: resultRows,
    canViewSource,
    isOwner,
    note,
  };
}
