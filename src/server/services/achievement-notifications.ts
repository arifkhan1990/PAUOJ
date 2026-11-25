import { and, count, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { contestRatingChanges, submissions } from "@/server/db/schema";
import { buildAchievements } from "@/lib/achievements";
import { getLearningModule } from "@/lib/learning/modules";
import { logger } from "@/server/logger";
import { computeLongestStreak } from "./activity";
import { notifyUser } from "./notifications";
import { practiceSubmissionCondition } from "./submission-filters";

/** Solved-count milestones. `1` intentionally replaces the old first-solve badge mail. */
export const SOLVED_MILESTONES = [1, 100, 250, 500, 700, 1000] as const;

export function milestoneForSolvedCount(solvedCount: number): number | null {
  return SOLVED_MILESTONES.find((value) => value === solvedCount) ?? null;
}

export type AchievementBadgeId =
  | "ten-solved"
  | "fifty-solved"
  | "prolific"
  | "polyglot"
  | "streak-7";

export type AchievementMetrics = {
  solvedCount: number;
  submissionCount: number;
  acceptedLanguages: number;
  longestStreak: number;
};

/**
 * Badges that fire on the exact threshold only. A `>=` check would mail every
 * existing user on the first run after this feature ships.
 */
export function achievementBadgesFor(
  metrics: AchievementMetrics,
): AchievementBadgeId[] {
  const badges: AchievementBadgeId[] = [];
  if (metrics.solvedCount === 10) badges.push("ten-solved");
  if (metrics.solvedCount === 50) badges.push("fifty-solved");
  if (metrics.submissionCount === 500) badges.push("prolific");
  if (metrics.acceptedLanguages === 3) badges.push("polyglot");
  if (metrics.longestStreak === 7) badges.push("streak-7");
  return badges;
}

export const RATING_TIERS = [
  { id: "rated-1600", target: 1600 },
  { id: "rated-1800", target: 1800 },
  { id: "rated-2000", target: 2000 },
] as const;

export type RatingTier = (typeof RATING_TIERS)[number];

/** Tiers crossed by one rating change: `old < target <= new`. */
export function crossedRatingTiers(
  oldRating: number,
  newRating: number,
): RatingTier[] {
  return RATING_TIERS.filter(
    (tier) => oldRating < tier.target && newRating >= tier.target,
  );
}

/**
 * Longest run of consecutive UTC days with an accepted submission. Input is
 * already grouped by day; duplicates are harmless.
 */
export function longestAcceptedDayStreak(dates: string[]): number {
  const days = Array.from(new Set(dates))
    .sort()
    .map((date) => ({ date, total: 1, accepted: 1 }));
  return computeLongestStreak(days);
}

type SubmissionStats = {
  solvedCount: number;
  submissionCount: number;
  acceptedLanguages: number;
};

async function loadSubmissionStats(userId: string): Promise<SubmissionStats> {
  const [row] = await getDb()
    .select({
      solvedCount: sql<number>`(count(distinct ${submissions.problemId}) filter (where ${submissions.status} = 'ACCEPTED'))::int`,
      submissionCount: sql<number>`count(*)::int`,
      acceptedLanguages: sql<number>`(count(distinct ${submissions.language}) filter (where ${submissions.status} = 'ACCEPTED'))::int`,
    })
    .from(submissions)
    .where(
      and(eq(submissions.userId, userId), practiceSubmissionCondition()),
    );
  return {
    solvedCount: Number(row?.solvedCount ?? 0),
    submissionCount: Number(row?.submissionCount ?? 0),
    acceptedLanguages: Number(row?.acceptedLanguages ?? 0),
  };
}

async function loadAcceptedDays(userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({
      date: sql<string>`to_char(date_trunc('day', ${submissions.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`,
    })
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        practiceSubmissionCondition(),
        eq(submissions.status, "ACCEPTED"),
      ),
    )
    .groupBy(sql`1`);
  return rows.map((row) => row.date);
}

type AchievementNotice = {
  type: "ACHIEVEMENT" | "MILESTONE";
  title: string;
  body: string;
  href: string;
  dedupeKey: string;
};

async function sendBestEffort(
  userId: string,
  notice: AchievementNotice,
): Promise<void> {
  try {
    await notifyUser({ userId, ...notice });
  } catch (error) {
    logger.warn("Achievement notification failed", {
      userId,
      dedupeKey: notice.dedupeKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function milestoneNotice(milestone: number): AchievementNotice {
  const next = SOLVED_MILESTONES.find((value) => value > milestone) ?? null;
  const body =
    milestone === 1
      ? "Your first accepted solve is on the board. Solve 10 to unlock the Getting Started badge."
      : next
        ? `${milestone} problems solved. The next milestone is ${next}.`
        : `${milestone} problems solved. Every milestone on the board is unlocked.`;
  return {
    type: "MILESTONE",
    title:
      milestone === 1
        ? "Milestone unlocked: 1 problem solved"
        : `Milestone unlocked: ${milestone} problems solved`,
    body,
    href: "/problems",
    dedupeKey: `milestone:solved:${milestone}`,
  };
}

function badgeNotices(metrics: AchievementMetrics): AchievementNotice[] {
  const badges = achievementBadgesFor(metrics);
  if (badges.length === 0) return [];
  const byId = new Map(
    buildAchievements({
      solvedCount: metrics.solvedCount,
      submissionCount: metrics.submissionCount,
      contestCount: 0,
      rating: 0,
      longestStreak: metrics.longestStreak,
      acceptedLanguages: metrics.acceptedLanguages,
    }).map((achievement) => [achievement.id, achievement]),
  );
  return badges.flatMap((id) => {
    const achievement = byId.get(id);
    if (!achievement) return [];
    return [
      {
        type: "ACHIEVEMENT" as const,
        title: `Achievement unlocked: ${achievement.label}`,
        body: achievement.description,
        href: "/profile",
        dedupeKey: `achievement:${id}`,
      },
    ];
  });
}

async function notifyModuleEnrollment(
  userId: string,
  problemSlug: string,
): Promise<void> {
  try {
    // learning-reminders is owned by another stream; a missing export or a
    // failure must never affect judging.
    const reminders = await import("./learning-reminders");
    await reminders.notifyModuleEnrollmentForProblem(userId, problemSlug);
  } catch (error) {
    logger.warn("Learning enrollment notification failed", {
      userId,
      problemSlug,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Called by the judge after an ACCEPTED verdict. Best-effort and idempotent:
 * every notice is deduped, and exact-threshold badges keep existing users from
 * being mailed on the first run.
 */
export async function afterAcceptedSubmission(
  userId: string,
  problemSlug: string,
): Promise<void> {
  await notifyModuleEnrollment(userId, problemSlug);

  const [stats, acceptedDays] = await Promise.all([
    loadSubmissionStats(userId),
    loadAcceptedDays(userId),
  ]);
  const metrics: AchievementMetrics = {
    solvedCount: stats.solvedCount,
    submissionCount: stats.submissionCount,
    acceptedLanguages: stats.acceptedLanguages,
    longestStreak: longestAcceptedDayStreak(acceptedDays),
  };

  const notices: AchievementNotice[] = [];
  const milestone = milestoneForSolvedCount(metrics.solvedCount);
  if (milestone !== null) notices.push(milestoneNotice(milestone));
  notices.push(...badgeNotices(metrics));

  for (const notice of notices) {
    await sendBestEffort(userId, notice);
  }
}

/**
 * Called after a contest rating finalises. Only the latest change is examined,
 * so a tier notice fires on the crossing contest and never on later ones.
 */
export async function notifyRatingAchievements(userId: string): Promise<void> {
  try {
    const db = getDb();
    const [latestRows, countRows] = await Promise.all([
      db
        .select({
          oldRating: contestRatingChanges.oldRating,
          newRating: contestRatingChanges.newRating,
        })
        .from(contestRatingChanges)
        .where(eq(contestRatingChanges.userId, userId))
        .orderBy(desc(contestRatingChanges.createdAt))
        .limit(1),
      db
        .select({ value: count() })
        .from(contestRatingChanges)
        .where(eq(contestRatingChanges.userId, userId)),
    ]);
    const latest = latestRows[0];
    const contestCount = Number(countRows[0]?.value ?? 0);
    if (!latest || contestCount === 0) return;

    const achievements = buildAchievements({
      solvedCount: 0,
      submissionCount: 0,
      contestCount,
      rating: latest.newRating,
      longestStreak: 0,
      acceptedLanguages: 0,
    });
    const byId = new Map(
      achievements.map((achievement) => [achievement.id, achievement]),
    );

    const ids: string[] = [];
    if (contestCount === 1) ids.push("contest-debut");
    for (const tier of crossedRatingTiers(latest.oldRating, latest.newRating)) {
      ids.push(tier.id);
    }

    for (const id of ids) {
      const achievement = byId.get(id);
      if (!achievement) continue;
      await sendBestEffort(userId, {
        type: "ACHIEVEMENT",
        title: `Achievement unlocked: ${achievement.label}`,
        body: `${achievement.description} Your rating is now ${latest.newRating}.`,
        href: "/profile",
        dedupeKey: `achievement:${id}`,
      });
    }
  } catch (error) {
    logger.warn("Rating achievement notification failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Called when a learning checkpoint badge is earned. Best-effort. */
export async function notifyLearningBadge(
  userId: string,
  moduleSlug: string,
): Promise<void> {
  const badge = getLearningModule(moduleSlug)?.checkpoint?.badge;
  if (!badge) return;
  await sendBestEffort(userId, {
    type: "ACHIEVEMENT",
    title: `Badge earned: ${badge.name}`,
    body: badge.description,
    href: `/learn/${moduleSlug}`,
    dedupeKey: `learning-badge:${badge.slug}`,
  });
}
