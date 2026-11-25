import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  auditLogs,
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
import {
  isContestRatingLocked,
  isRatingReviewOpen,
} from "@/lib/contest-rating";
import { isPendingVerdict } from "@/lib/verdicts";
import { logger } from "@/server/logger";
import { notifyContestResults } from "./contest-notifications";
import { notifyRatingAchievements } from "./achievement-notifications";

type FinalizeOutcome = "finalized" | "skipped";

/**
 * Post-commit notices for a contest this call just finalised. The rating rows
 * are already durable, so every failure here is logged and swallowed rather
 * than surfaced to the caller.
 */
async function notifyFinalizedContest(contestId: string): Promise<void> {
  try {
    await notifyContestResults(contestId);
  } catch (error) {
    logger.warn("Contest result notifications failed", {
      contestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const participants = await getDb()
      .select({ userId: contestRatingChanges.userId })
      .from(contestRatingChanges)
      .where(eq(contestRatingChanges.contestId, contestId));
    for (const participant of participants) {
      try {
        await notifyRatingAchievements(participant.userId);
      } catch (error) {
        logger.warn("Rating achievement notification failed", {
          contestId,
          userId: participant.userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } catch (error) {
    logger.warn("Rating achievement sweep failed", {
      contestId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export const PENDING_SUBMISSION_STATUSES = ["QUEUED", "JUDGING"] as const;

/** Contests that must be rated before a contest ending at `endAt` with `id`. */
export function earlierUnfinalizedContestCondition(
  endAt: Date,
  contestId: string,
): SQL {
  return and(
    isNull(contests.ratedAt),
    or(
      lt(contests.endAt, endAt),
      and(eq(contests.endAt, endAt), lt(contests.id, contestId)),
    ),
  )!;
}

/**
 * Finalises one contest if its review window has closed. Returns "finalized"
 * only when this call wrote `rated_at`; "skipped" covers already-rated,
 * still-running, review-window, pending-verdict or earlier-unfinalized contests.
 */
export async function runContestRatingFinalization(
  slug: string,
  now: Date,
): Promise<FinalizeOutcome> {
  const db = getDb();
  const rows = await db
    .select({
      id: contests.id,
      endAt: contests.endAt,
      ratedAt: contests.ratedAt,
      format: contests.format,
    })
    .from(contests)
    .where(eq(contests.slug, slug))
    .limit(1);
  const contest = rows[0];
  if (!contest) return "skipped";
  if (isContestRatingLocked(contest.ratedAt)) return "skipped";
  if (isRatingReviewOpen(contest.endAt, now)) return "skipped";

  const outcome = await db.transaction(async (tx): Promise<FinalizeOutcome> => {
    const lockedRows = await tx
      .select({
        id: contests.id,
        startAt: contests.startAt,
        endAt: contests.endAt,
        ratedAt: contests.ratedAt,
        format: contests.format,
      })
      .from(contests)
      .where(eq(contests.id, contest.id))
      .for("update")
      .limit(1);
    const locked = lockedRows[0];
    // Re-check inside the lock: another worker or a direct call may have won.
    if (!locked) return "skipped";
    if (isContestRatingLocked(locked.ratedAt)) return "skipped";
    if (isRatingReviewOpen(locked.endAt, now)) return "skipped";

    // Direct callers (seed/tests) and late sweeps must not skip ahead: rating
    // this contest first would build on an older contest's pre-rating value.
    const [earlier] = await tx
      .select({ id: contests.id, slug: contests.slug })
      .from(contests)
      .where(earlierUnfinalizedContestCondition(locked.endAt, locked.id))
      .limit(1);
    if (earlier) {
      logger.warn(
        "Contest rating finalization deferred until earlier contests are rated",
        {
          contestId: locked.id,
          slug,
          earlierContestId: earlier.id,
          earlierContestSlug: earlier.slug,
        },
      );
      return "skipped";
    }

    // GROUP contests have no individual scoreboard, but `rated_at` still locks
    // rejudges. Wait for the review window to settle before that lock.
    const [pendingBeforeGroup] = await tx
      .select({ id: submissions.id })
      .from(submissions)
      .where(
        and(
          eq(submissions.contestId, locked.id),
          isNull(submissions.virtualContestId),
          inArray(submissions.status, [...PENDING_SUBMISSION_STATUSES]),
        ),
      )
      .limit(1);
    if (pendingBeforeGroup) {
      logger.warn("Contest rating finalization deferred for pending verdicts", {
        contestId: locked.id,
        slug,
        pending: 1,
      });
      return "skipped";
    }

    if (locked.format === "GROUP") {
      await tx
        .update(contests)
        .set({ ratedAt: now, updatedAt: now })
        .where(eq(contests.id, locked.id));
      await tx.insert(auditLogs).values({
        action: "contest.ratings_finalized",
        entityType: "contest",
        entityId: locked.id,
        metadata: {
          format: locked.format,
          ratedParticipants: 0,
          appliedChanges: 0,
          finalizedAt: now.toISOString(),
        },
      });
      return "finalized";
    }

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
        // Banned users never enter the rated field. computeScoreboard only ranks
        // participants it is given, so their submissions are ignored too.
        .where(
          and(
            eq(contestRegistrations.contestId, locked.id),
            eq(users.isBanned, false),
          ),
        ),
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
        )
        // Deterministic first-blood/penalty input when two runs share a
        // timestamp; computeScoreboard is a stable sort over this order.
        .orderBy(asc(submissions.createdAt), asc(submissions.id)),
    ]);

    // A rejudge during the review window flips a submission to QUEUED in the
    // same transaction that locks this contest row. Waiting here means the
    // rating snapshot always reflects the reviewed verdicts.
    const pending = submissionRows.filter((row) =>
      isPendingVerdict(row.status),
    );
    if (pending.length > 0) {
      logger.warn("Contest rating finalization deferred for pending verdicts", {
        contestId: locked.id,
        slug,
        pending: pending.length,
      });
      return "skipped";
    }

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

    // History belongs on the contest timeline, even when finalised later.
    const ratedForContestAt = locked.endAt;
    let ratedParticipants = 0;
    let appliedChanges = 0;
    if (compacted.length >= 2) {
      // Lock every participant row in a stable id order before reading ratings.
      // Two contests finalising at once then serialise instead of losing an
      // update (last-write-wins on users.rating).
      const ratingRows = await tx
        .select({ id: users.id, rating: users.rating })
        .from(users)
        .where(
          inArray(
            users.id,
            compacted.map((row) => row.userId),
          ),
        )
        .orderBy(asc(users.id))
        .for("update");
      const ratings = new Map(ratingRows.map((row) => [row.id, row.rating]));
      const participants: RatingParticipant[] = compacted.map((row) => ({
        ...row,
        rating: ratings.get(row.userId) ?? 1500,
      }));
      const changes = computeRatingChanges(participants);
      ratedParticipants = compacted.length;
      appliedChanges = changes.length;

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
    await tx.insert(auditLogs).values({
      action: "contest.ratings_finalized",
      entityType: "contest",
      entityId: locked.id,
      metadata: {
        format: locked.format,
        ratedParticipants,
        appliedChanges,
        finalizedAt: now.toISOString(),
      },
    });
    return "finalized";
  });

  // Outside the transaction: a mail/notification failure must not undo or
  // fail a finalization that is already committed.
  if (outcome === "finalized") {
    await notifyFinalizedContest(contest.id);
  }
  return outcome;
}

/**
 * Finalises a finished contest exactly once, one hour after it ends. The worker
 * sweep is the normal writer; seed/tests may call it directly. Page views must
 * not call it, because a direct call could rate a newer contest before an
 * earlier one. The contest row lock and the chronological check are re-run
 * inside the transaction.
 */
export async function finalizeContestRatings(
  slug: string,
  now: Date = new Date(),
): Promise<void> {
  await runContestRatingFinalization(slug, now);
}
