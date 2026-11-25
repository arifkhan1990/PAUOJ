import { and, asc, inArray, isNull, lte, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/server/db";
import { contests, submissions } from "@/server/db/schema";
import { RATING_REVIEW_WINDOW_MS } from "@/lib/contest-rating";
import { logger } from "@/server/logger";
import {
  PENDING_SUBMISSION_STATUSES,
  runContestRatingFinalization,
} from "./ratings";

export type DueRatingContest = {
  id: string;
  slug: string;
  endAt: Date;
};

export type FinalizeDueResult = {
  /** Contests that moved from pending to rated in this sweep. */
  finalized: number;
  /** Contests whose finalization threw; they are retried next sweep. */
  failed: number;
  finalizedSlugs: string[];
  failedSlugs: string[];
};

/**
 * WHERE for contests a sweep may finalise: the review window has closed, no
 * rating pass has run yet, no earlier contest by `(end_at, id)` is still
 * unfinalized, and no contest submission is still queued/judging.
 *
 * Chronological order is accuracy-over-speed: if the oldest due contest has a
 * pending verdict, later contests wait instead of rating against a stale
 * `users.rating` chain. The sweep logs that wait rather than skipping ahead.
 * Same `end_at` ties break by `id`, so the stream order is deterministic.
 */
export function dueRatingContestCondition(now: Date = new Date()): SQL {
  const cutoff = new Date(now.getTime() - RATING_REVIEW_WINDOW_MS);
  return and(
    isNull(contests.ratedAt),
    lte(contests.endAt, cutoff),
    // Raw self-alias: Drizzle's `alias()` renders only the alias name inside a
    // `sql` template, not its `from ... as ...` definition.
    sql`not exists (
      select 1 from ${contests} as earlier_contests
      where earlier_contests.rated_at is null
        and (
          earlier_contests.end_at < ${contests.endAt}
          or (
            earlier_contests.end_at = ${contests.endAt}
            and earlier_contests.id < ${contests.id}
          )
        )
    )`,
    sql`not exists (
      select 1 from ${submissions}
      where ${submissions.contestId} = ${contests.id}
        and ${isNull(submissions.virtualContestId)}
        and ${inArray(submissions.status, [...PENDING_SUBMISSION_STATUSES])}
    )`,
  )!;
}

/** Contests whose review window has closed but `rated_at` is still null. */
export async function listDueRatingContests(
  now: Date = new Date(),
  limit: number = 10,
): Promise<DueRatingContest[]> {
  return getDb()
    .select({
      id: contests.id,
      slug: contests.slug,
      endAt: contests.endAt,
    })
    .from(contests)
    .where(dueRatingContestCondition(now))
    .orderBy(asc(contests.endAt), asc(contests.id))
    .limit(limit);
}

/** Avoid log spam while the earliest due contest waits on a rejudge. */
const WAITING_LOG_INTERVAL_MS = 5 * 60 * 1000;
let lastWaitingLogAt = 0;

async function logWaitingSweep(now: Date): Promise<void> {
  if (now.getTime() - lastWaitingLogAt < WAITING_LOG_INTERVAL_MS) return;
  const cutoff = new Date(now.getTime() - RATING_REVIEW_WINDOW_MS);
  const [waiting] = await getDb()
    .select({ id: contests.id, slug: contests.slug, endAt: contests.endAt })
    .from(contests)
    .where(and(isNull(contests.ratedAt), lte(contests.endAt, cutoff)))
    .orderBy(asc(contests.endAt), asc(contests.id))
    .limit(1);
  if (!waiting) return;
  lastWaitingLogAt = now.getTime();
  logger.warn(
    "Contest rating sweep waiting for the earliest due contest to settle",
    {
      contestId: waiting.id,
      slug: waiting.slug,
      endAt: waiting.endAt.toISOString(),
      reason: "pending verdicts or an earlier unfinalized contest",
    },
  );
}

/**
 * Sweeps due contests sequentially in `(endAt asc, id asc)` order. The due query holds
 * later contests back while an earlier one is unfinalized or has pending
 * verdicts, so a stuck rejudge delays later ratings (accuracy over speed); the
 * waiting probe above logs that state. A failure in one contest does not stop
 * the rest of the batch.
 */
export async function finalizeDueContestRatings(
  now: Date = new Date(),
  limit: number = 10,
): Promise<FinalizeDueResult> {
  let finalized = 0;
  let failed = 0;
  const finalizedSlugs: string[] = [];
  const failedSlugs: string[] = [];

  // Chronological gating exposes one eligible contest at a time. Re-query after
  // each pass so a backlog drains up to `limit` contests per sweep instead of
  // one every 60 seconds.
  for (let pass = 0; pass < limit; pass += 1) {
    const due = await listDueRatingContests(now, 1);
    if (due.length === 0) {
      if (pass === 0) await logWaitingSweep(now);
      break;
    }
    let progressed = false;
    for (const contest of due) {
      try {
        const outcome = await runContestRatingFinalization(contest.slug, now);
        if (outcome === "finalized") {
          finalized += 1;
          finalizedSlugs.push(contest.slug);
          progressed = true;
        }
      } catch (error) {
        failed += 1;
        failedSlugs.push(contest.slug);
        logger.warn("Contest rating finalization failed", {
          contestId: contest.id,
          slug: contest.slug,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    // A skipped contest means pending verdicts or a direct-call guard; the next
    // sweep retries.
    if (!progressed) break;
  }

  return { finalized, failed, finalizedSlugs, failedSlugs };
}

/**
 * Best-effort, ordered fallback for when the worker is unavailable. At most one
 * call runs every 30s per server process; it finalises only the earliest due
 * contest so a page view can never jump the rating queue. Errors are logged and
 * swallowed — the worker remains the primary writer.
 */
const FALLBACK_THROTTLE_MS = 30_000;
let lastFallbackAt = 0;
let fallbackInFlight: Promise<boolean> | null = null;

export function maybeFinalizeRatingSweep(): Promise<boolean> {
  // Single-flight: metadata and page renders both call this. Concurrent
  // callers await the same sweep so their subsequent rated_at re-read sees the
  // committed finalization instead of racing it.
  if (fallbackInFlight) return fallbackInFlight;
  const now = Date.now();
  if (now - lastFallbackAt < FALLBACK_THROTTLE_MS) return Promise.resolve(false);
  lastFallbackAt = now;
  fallbackInFlight = (async () => {
    try {
      const result = await finalizeDueContestRatings(new Date(now), 1);
      return result.finalized > 0;
    } catch (error) {
      logger.warn("Contest rating fallback sweep failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    } finally {
      fallbackInFlight = null;
    }
  })();
  return fallbackInFlight;
}
