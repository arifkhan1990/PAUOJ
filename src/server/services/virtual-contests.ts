import { and, asc, eq, isNull, gt } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contests,
  problems,
  submissions,
  virtualContests,
} from "@/server/db/schema";
import type { ContestProblemItem, VirtualContestInfo } from "@/lib/types";
import { contestStatus } from "@/lib/contests";
import { computeScoreboard } from "@/server/contests/scoring";

async function loadEndedPublicContest(slug: string) {
  const [contest] = await getDb()
    .select()
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  if (!contest || !contest.isPublic) throw errors.notFound("Contest not found.");
  if (contestStatus(contest.startAt, contest.endAt) !== "ENDED") {
    throw errors.conflict("Virtual contests are available after the contest ends.");
  }
  if (contest.format === "GROUP") {
    throw errors.conflict(
      "Virtual replay is only available for solo contests. Team contests are ranked on the original round.",
    );
  }
  return contest;
}

export async function startVirtualContest(
  slug: string,
  userId: string,
): Promise<{ id: string }> {
  const contest = await loadEndedPublicContest(slug);
  const now = new Date();
  const durationMs = Math.max(
    60_000,
    contest.endAt.getTime() - contest.startAt.getTime(),
  );
  const endsAt = new Date(now.getTime() + durationMs);
  const [row] = await getDb()
    .insert(virtualContests)
    .values({
      contestId: contest.id,
      userId,
      startedAt: now,
      endsAt,
      finishedAt: null,
    })
    .onConflictDoUpdate({
      target: [virtualContests.contestId, virtualContests.userId],
      set: {
        startedAt: now,
        endsAt,
        finishedAt: null,
        updatedAt: now,
      },
    })
    .returning({ id: virtualContests.id });
  if (!row) throw errors.unavailable("Could not start the virtual contest.");
  await getDb()
    .delete(submissions)
    .where(eq(submissions.virtualContestId, row.id));
  return { id: row.id };
}

export async function finishVirtualContest(
  slug: string,
  userId: string,
): Promise<void> {
  const [contest] = await getDb()
    .select({ id: contests.id })
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  if (!contest) throw errors.notFound("Contest not found.");
  const now = new Date();
  await getDb()
    .update(virtualContests)
    .set({ finishedAt: now, endsAt: now, updatedAt: now })
    .where(
      and(
        eq(virtualContests.contestId, contest.id),
        eq(virtualContests.userId, userId),
        isNull(virtualContests.finishedAt),
      ),
    );
}

export async function getVirtualContest(
  slug: string,
  userId: string,
): Promise<VirtualContestInfo | null> {
  const db = getDb();
  const [contest] = await db
    .select()
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  if (!contest || !contest.isPublic) return null;
  const [session] = await db
    .select()
    .from(virtualContests)
    .where(
      and(
        eq(virtualContests.contestId, contest.id),
        eq(virtualContests.userId, userId),
      ),
    )
    .limit(1);
  if (!session) return null;

  const now = new Date();
  if (!session.finishedAt && now > session.endsAt) {
    await db
      .update(virtualContests)
      .set({ finishedAt: session.endsAt, updatedAt: now })
      .where(eq(virtualContests.id, session.id));
    session.finishedAt = session.endsAt;
  }

  const problemRows = await db
    .select({
      id: problems.id,
      label: contestProblems.label,
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
    })
    .from(contestProblems)
    .innerJoin(problems, eq(problems.id, contestProblems.problemId))
    .where(eq(contestProblems.contestId, contest.id))
    .orderBy(asc(contestProblems.position));

  const submissionRows = await db
    .select({
      userId: submissions.userId,
      problemId: submissions.problemId,
      status: submissions.status,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(eq(submissions.virtualContestId, session.id));
  const row = computeScoreboard({
    startAt: session.startedAt,
    problems: problemRows,
    participants: [
      { userId, username: String(userId), displayName: String(userId) },
    ],
    submissions: submissionRows,
  })[0];
  const solved = new Set(
    submissionRows
      .filter((submission) => submission.status === "ACCEPTED")
      .map((submission) => submission.problemId),
  );
  const attempted = new Set(submissionRows.map((submission) => submission.problemId));
  const virtualProblems: ContestProblemItem[] = problemRows.map((problem) => ({
    label: problem.label,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    points: problem.points,
    solvedByMe: solved.has(problem.id),
    attemptedByMe: attempted.has(problem.id),
  }));

  return {
    id: session.id,
    contestSlug: contest.slug,
    contestTitle: contest.title,
    startedAt: session.startedAt.toISOString(),
    endsAt: session.endsAt.toISOString(),
    finishedAt: session.finishedAt?.toISOString() ?? null,
    problems: virtualProblems,
    solved: row?.solved ?? 0,
    penalty: row?.penalty ?? 0,
  };
}

export async function getVirtualSubmissionContext(
  slug: string,
  virtualContestId: string,
  userId: string,
): Promise<{ id: string; contestId: string; problemIds: string[] }> {
  const db = getDb();
  const [session] = await db
    .select({
      id: virtualContests.id,
      contestId: virtualContests.contestId,
      endedAt: virtualContests.endsAt,
      finishedAt: virtualContests.finishedAt,
    })
    .from(virtualContests)
    .innerJoin(contests, eq(contests.id, virtualContests.contestId))
    .where(
      and(
        eq(virtualContests.id, virtualContestId),
        eq(virtualContests.userId, userId),
        eq(contests.slug, slug),
        isNull(virtualContests.finishedAt),
        gt(virtualContests.endsAt, new Date()),
      ),
    )
    .limit(1);
  if (!session) {
    throw errors.conflict("This virtual contest is not active.");
  }
  const problemRows = await db
    .select({ problemId: contestProblems.problemId })
    .from(contestProblems)
    .where(eq(contestProblems.contestId, session.contestId));
  return {
    id: session.id,
    contestId: session.contestId,
    problemIds: problemRows.map((row) => row.problemId),
  };
}
