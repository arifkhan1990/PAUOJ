import { and, asc, eq, isNull, lt } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestRegistrations,
  contests,
  problems,
  submissions,
  users,
} from "@/server/db/schema";
import type { ContestScoreboard } from "@/lib/types";
import { contestStatus } from "@/lib/contests";
import { computeScoreboard } from "@/server/contests/scoring";
import { finalizeContestRatings } from "./ratings";

export async function getScoreboard(
  slug: string,
  isAdmin: boolean,
): Promise<ContestScoreboard> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select()
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  const contest = rows[0];
  if (!contest || (!contest.isPublic && !isAdmin)) {
    throw errors.notFound("Contest not found.");
  }
  const status = contestStatus(contest.startAt, contest.endAt, now);
  if (status === "UPCOMING" && !isAdmin) {
    throw errors.forbidden(
      "The scoreboard is not available before the contest starts.",
    );
  }
  if (status === "ENDED") {
    try {
      await finalizeContestRatings(contest.slug);
    } catch (error) {
      console.error("Contest rating finalization failed", error);
    }
  }

  const problemRows = await db
    .select({
      id: problems.id,
      label: contestProblems.label,
    })
    .from(contestProblems)
    .innerJoin(problems, eq(problems.id, contestProblems.problemId))
    .where(eq(contestProblems.contestId, contest.id))
    .orderBy(asc(contestProblems.position));

  const participantRows = await db
    .select({
      userId: contestRegistrations.userId,
      username: users.username,
      displayName: users.displayName,
    })
    .from(contestRegistrations)
    .innerJoin(users, eq(users.id, contestRegistrations.userId))
    .where(eq(contestRegistrations.contestId, contest.id));

  const freezeAt =
    contest.freezeMinutes > 0
      ? new Date(contest.endAt.getTime() - contest.freezeMinutes * 60_000)
      : null;
  const frozen = Boolean(
    !isAdmin && status === "RUNNING" && freezeAt && now >= freezeAt,
  );
  const submissionConditions = [
    eq(submissions.contestId, contest.id),
    isNull(submissions.virtualContestId),
  ];
  if (frozen && freezeAt) {
    submissionConditions.push(lt(submissions.createdAt, freezeAt));
  }
  const submissionRows = await db
    .select({
      userId: submissions.userId,
      problemId: submissions.problemId,
      status: submissions.status,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .where(and(...submissionConditions));

  const scoreboard = computeScoreboard({
    startAt: contest.startAt,
    problems: problemRows,
    participants: participantRows.map((row) => ({
      userId: row.userId,
      username: row.username,
      displayName: row.displayName,
    })),
    submissions: submissionRows,
  });

  return {
    contest: {
      slug: contest.slug,
      title: contest.title,
      startAt: contest.startAt.toISOString(),
      endAt: contest.endAt.toISOString(),
      status,
      freezeMinutes: contest.freezeMinutes,
    },
    frozen,
    freezeAt: freezeAt?.toISOString() ?? null,
    labels: problemRows.map((row) => row.label),
    rows: scoreboard,
  };
}
