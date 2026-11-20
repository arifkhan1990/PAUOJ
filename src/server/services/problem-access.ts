import { and, eq, gt, inArray, isNull, lte } from "drizzle-orm";
import { ApiError } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  assessmentParticipants,
  assessmentProblems,
  assessments,
  contestProblems,
  contestRegistrations,
  contests,
} from "@/server/db/schema";

export async function getRestrictedProblemIds(
  userId: string | null,
  isAdmin: boolean,
): Promise<string[]> {
  if (isAdmin) return [];
  const db = getDb();
  const now = new Date();

  const [contestRows, assessmentRows] = await Promise.all([
    db
      .select({
        contestId: contests.id,
        problemId: contestProblems.problemId,
      })
      .from(contests)
      .innerJoin(contestProblems, eq(contestProblems.contestId, contests.id))
      .where(
        and(
          eq(contests.isPublic, true),
          lte(contests.startAt, now),
          gt(contests.endAt, now),
        ),
      ),
    db
      .select({
        assessmentId: assessments.id,
        problemId: assessmentProblems.problemId,
      })
      .from(assessments)
      .innerJoin(
        assessmentProblems,
        eq(assessmentProblems.assessmentId, assessments.id),
      )
      .where(
        and(
          eq(assessments.isPublished, true),
          lte(assessments.startAt, now),
          gt(assessments.endAt, now),
        ),
      ),
  ]);

  if (contestRows.length === 0 && assessmentRows.length === 0) return [];

  const accessibleContests = new Set<string>();
  const accessibleAssessments = new Set<string>();

  if (userId) {
    const contestIds = [...new Set(contestRows.map((row) => row.contestId))];
    const assessmentIds = [
      ...new Set(assessmentRows.map((row) => row.assessmentId)),
    ];
    const [registrations, participations] = await Promise.all([
      contestIds.length > 0
        ? db
            .select({ contestId: contestRegistrations.contestId })
            .from(contestRegistrations)
            .where(
              and(
                eq(contestRegistrations.userId, userId),
                inArray(contestRegistrations.contestId, contestIds),
              ),
            )
        : Promise.resolve([]),
      assessmentIds.length > 0
        ? db
            .select({ assessmentId: assessmentParticipants.assessmentId })
            .from(assessmentParticipants)
            .where(
              and(
                eq(assessmentParticipants.userId, userId),
                inArray(assessmentParticipants.assessmentId, assessmentIds),
                gt(assessmentParticipants.expiresAt, now),
                isNull(assessmentParticipants.finishedAt),
              ),
            )
        : Promise.resolve([]),
    ]);
    for (const row of registrations) accessibleContests.add(row.contestId);
    for (const row of participations) {
      accessibleAssessments.add(row.assessmentId);
    }
  }

  const map = new Map<string, { hasContext: boolean; accessible: boolean }>();
  for (const row of contestRows) {
    const entry = map.get(row.problemId) ?? {
      hasContext: false,
      accessible: false,
    };
    entry.hasContext = true;
    if (accessibleContests.has(row.contestId)) entry.accessible = true;
    map.set(row.problemId, entry);
  }
  for (const row of assessmentRows) {
    const entry = map.get(row.problemId) ?? {
      hasContext: false,
      accessible: false,
    };
    entry.hasContext = true;
    if (accessibleAssessments.has(row.assessmentId)) entry.accessible = true;
    map.set(row.problemId, entry);
  }

  return [...map.entries()]
    .filter(([, value]) => value.hasContext && !value.accessible)
    .map(([problemId]) => problemId);
}

export async function assertProblemNotInLiveContext(
  problemId: string,
  code: string,
  message: string,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  const [contestRows, assessmentRows] = await Promise.all([
    db
      .select({ problemId: contestProblems.problemId })
      .from(contestProblems)
      .innerJoin(contests, eq(contests.id, contestProblems.contestId))
      .where(
        and(
          eq(contestProblems.problemId, problemId),
          lte(contests.startAt, now),
          gt(contests.endAt, now),
        ),
      )
      .limit(1),
    db
      .select({ problemId: assessmentProblems.problemId })
      .from(assessmentProblems)
      .innerJoin(
        assessments,
        eq(assessments.id, assessmentProblems.assessmentId),
      )
      .where(
        and(
          eq(assessmentProblems.problemId, problemId),
          eq(assessments.isPublished, true),
          lte(assessments.startAt, now),
          gt(assessments.endAt, now),
        ),
      )
      .limit(1),
  ]);
  if (contestRows.length > 0 || assessmentRows.length > 0) {
    throw new ApiError(code, message, 403);
  }
}
