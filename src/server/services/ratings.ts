import { and, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  contestProblems,
  contestRatingChanges,
  contestRegistrations,
  contests,
  problems,
  submissions,
  users,
} from "@/server/db/schema";
import { computeScoreboard } from "@/server/contests/scoring";
import {
  compactRanks,
  computeRatingChanges,
} from "@/server/contests/rating";
import type { RatingParticipant } from "@/lib/rating-types";

/**
 * Finalises a finished contest exactly once. The contest row is locked and its
 * `rated_at` marker is re-checked inside the transaction, so concurrent page
 * views cannot apply the same rating changes twice.
 */
export async function finalizeContestRatings(slug: string): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({
      id: contests.id,
      endAt: contests.endAt,
      ratedAt: contests.ratedAt,
    })
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  const contest = rows[0];
  if (!contest || contest.ratedAt || contest.endAt > new Date()) return;

  await db.transaction(async (tx) => {
    const lockedRows = await tx
      .select({
        id: contests.id,
        startAt: contests.startAt,
        endAt: contests.endAt,
        ratedAt: contests.ratedAt,
      })
      .from(contests)
      .where(eq(contests.id, contest.id))
      .for("update")
      .limit(1);
    const locked = lockedRows[0];
    if (!locked || locked.ratedAt || locked.endAt > new Date()) return;

    const [problemRows, participantRows, submissionRows] = await Promise.all([
      tx
        .select({
          id: problems.id,
          label: contestProblems.label,
        })
        .from(contestProblems)
        .innerJoin(problems, eq(problems.id, contestProblems.problemId))
        .where(eq(contestProblems.contestId, locked.id)),
      tx
        .select({
          userId: contestRegistrations.userId,
          username: users.username,
          displayName: users.displayName,
        })
        .from(contestRegistrations)
        .innerJoin(users, eq(users.id, contestRegistrations.userId))
        .where(eq(contestRegistrations.contestId, locked.id)),
      tx
        .select({
          userId: submissions.userId,
          problemId: submissions.problemId,
          status: submissions.status,
          createdAt: submissions.createdAt,
        })
        .from(submissions)
        .where(
          and(
            eq(submissions.contestId, locked.id),
            isNull(submissions.virtualContestId),
          ),
        ),
    ]);

    const scoreboard = computeScoreboard({
      startAt: locked.startAt,
      problems: problemRows,
      participants: participantRows,
      submissions: submissionRows,
    });
    const userIdByName = new Map(
      participantRows.map((row) => [row.username, row.userId]),
    );
    const submitted = new Set(submissionRows.map((row) => row.userId));
    const ranked = scoreboard
      .map((row) => {
        const userId = userIdByName.get(row.user.username);
        return userId && submitted.has(userId)
          ? { userId, rank: row.rank }
          : null;
      })
      .filter((row): row is { userId: string; rank: number } => row !== null);
    const compacted = compactRanks(ranked);

    const now = new Date();
    // History belongs on the contest timeline, even when finalised on a later page view.
    const ratedForContestAt = locked.endAt;
    if (compacted.length >= 2) {
      const ratingRows = await tx
        .select({ id: users.id, rating: users.rating })
        .from(users)
        .where(
          inArray(
            users.id,
            compacted.map((row) => row.userId),
          ),
        );
      const ratings = new Map(ratingRows.map((row) => [row.id, row.rating]));
      const participants: RatingParticipant[] = compacted.map((row) => ({
        ...row,
        rating: ratings.get(row.userId) ?? 1500,
      }));
      const changes = computeRatingChanges(participants);

      for (const change of changes) {
        await tx
          .update(users)
          .set({ rating: change.newRating, updatedAt: now })
          .where(eq(users.id, change.userId));
        await tx
          .insert(contestRatingChanges)
          .values({
            contestId: locked.id,
            userId: change.userId,
            rank: change.rank,
            oldRating: change.oldRating,
            newRating: change.newRating,
            delta: change.delta,
            createdAt: ratedForContestAt,
            updatedAt: now,
          })
          .onConflictDoNothing();
      }
    }

    await tx
      .update(contests)
      .set({ ratedAt: now, updatedAt: now })
      .where(eq(contests.id, locked.id));
  });
}
