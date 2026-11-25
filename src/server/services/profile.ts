import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  contestRatingChanges,
  contests,
  problems,
  problemTags,
  submissions,
  tags,
  users,
} from "@/server/db/schema";
import type { Difficulty, ProfileStats } from "@/lib/types";
import { buildAchievements } from "@/lib/achievements";
import {
  buildHeatmap,
  computeActiveDays,
  computeCurrentStreak,
  computeLongestStreak,
} from "./activity";
import { getUserRank } from "./rank";
import { getProfileEditorials } from "./profile-editorials";
import { getProfileSocialSummary } from "./profile-follows";
import { buildProblemProgress } from "./profile-progress";
import { getRatingRankStats } from "./profile-rating";
import { getLearningBadges } from "./learning-access";
import { practiceSubmissionCondition } from "./submission-filters";
import { listSubmissions } from "./submissions";

export async function getProfile(
  username: string,
  viewer: { id: string; role: "USER" | "TEACHER" | "ADMIN" } | null,
): Promise<ProfileStats | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      bio: users.bio,
      country: users.country,
      institution: users.institution,
      website: users.website,
      github: users.github,
      linkedin: users.linkedin,
      currentStatus: users.currentStatus,
      companyName: users.companyName,
      jobTitle: users.jobTitle,
      skills: users.skills,
      rating: users.rating,
      createdAt: users.createdAt,
      isBanned: users.isBanned,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
    })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);
  const user = rows[0];
  if (!user || user.isBanned) return null;

  // Public practice aggregates only: invigilated assessment and
  // virtual-contest submissions never count toward profile stats (E6).
  const practiceSubmissions = and(
    eq(submissions.userId, user.id),
    practiceSubmissionCondition(),
  )!;
  const [submissionRow] = await db
    .select({ value: count() })
    .from(submissions)
    .where(practiceSubmissions);
  const [acceptedRow] = await db
    .select({ value: count() })
    .from(submissions)
    .where(and(practiceSubmissions, eq(submissions.status, "ACCEPTED")));

  const solvedRows = await db
    .selectDistinct({
      problemId: submissions.problemId,
      points: problems.points,
      difficulty: problems.difficulty,
    })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .where(and(practiceSubmissions, eq(submissions.status, "ACCEPTED")));

  const difficultySolved: Record<Difficulty, number> = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
    EXPERT: 0,
  };
  const difficultyTotals: Record<Difficulty, number> = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
    EXPERT: 0,
  };
  let points = 0;
  for (const row of solvedRows) {
    points += row.points;
    difficultySolved[row.difficulty] += 1;
  }

  const [
    languageRows,
    verdictRows,
    problemActivityRows,
    difficultyTotalRows,
    tagActivityRows,
    tagTotalRows,
  ] = await Promise.all([
      db
        .select({
          language: submissions.language,
          total: count(),
          accepted: sql<number>`(count(*) filter (where ${submissions.status} = 'ACCEPTED'))::int`,
        })
        .from(submissions)
        .where(practiceSubmissions)
        .groupBy(submissions.language),
      db
        .select({ status: submissions.status, value: count() })
        .from(submissions)
        .where(practiceSubmissions)
        .groupBy(submissions.status),
      (() => {
        const problemActivity = db
          .select({
            problemId: submissions.problemId,
            attempts: sql<number>`count(*)::int`.as("attempts"),
            lastActivityAt: sql<Date>`max(${submissions.createdAt})`.as(
              "last_activity_at",
            ),
            accepted: sql<boolean>`bool_or(${submissions.status} = 'ACCEPTED')`.as(
              "accepted",
            ),
          })
          .from(submissions)
          .where(practiceSubmissions)
          .groupBy(submissions.problemId)
          .as("problem_activity");
        return db
          .select({
            slug: problems.slug,
            title: problems.title,
            difficulty: problems.difficulty,
            points: problems.points,
            attempts: problemActivity.attempts,
            lastActivityAt: problemActivity.lastActivityAt,
            accepted: problemActivity.accepted,
          })
          .from(problemActivity)
          .innerJoin(problems, eq(problems.id, problemActivity.problemId))
          .orderBy(desc(problemActivity.lastActivityAt));
      })(),
      db
        .select({ difficulty: problems.difficulty, value: count() })
        .from(problems)
        .where(eq(problems.isPublic, true))
        .groupBy(problems.difficulty),
      db
        .select({
          name: tags.name,
          slug: tags.slug,
          attempted: sql<number>`count(distinct ${problemTags.problemId})::int`,
          solved: sql<number>`(count(distinct ${problemTags.problemId}) filter (where ${submissions.status} = 'ACCEPTED'))::int`,
        })
        .from(submissions)
        .innerJoin(
          problemTags,
          eq(problemTags.problemId, submissions.problemId),
        )
        .innerJoin(tags, eq(tags.id, problemTags.tagId))
        .innerJoin(problems, eq(problems.id, submissions.problemId))
        .where(and(practiceSubmissions, eq(problems.isPublic, true)))
        .groupBy(tags.name, tags.slug),
      db
        .select({
          name: tags.name,
          slug: tags.slug,
          total: sql<number>`count(distinct ${problemTags.problemId})::int`,
        })
        .from(tags)
        .innerJoin(problemTags, eq(problemTags.tagId, tags.id))
        .innerJoin(problems, eq(problems.id, problemTags.problemId))
        .where(eq(problems.isPublic, true))
        .groupBy(tags.name, tags.slug),
    ]);

  for (const row of difficultyTotalRows) {
    difficultyTotals[row.difficulty] = Number(row.value);
  }

  const languageStats = languageRows
    .map((row) => {
      const total = Number(row.total);
      const accepted = Number(row.accepted);
      return {
        language: row.language,
        submissions: total,
        accepted,
        acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
      };
    })
    .sort((left, right) => right.submissions - left.submissions);

  const tagTotals = new Map(
    tagTotalRows.map((row) => [row.slug, Number(row.total)]),
  );
  const tagStats = tagActivityRows
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      solved: Number(row.solved),
      attempted: Number(row.attempted),
      total: tagTotals.get(row.slug) ?? 0,
    }))
    .filter((row) => row.attempted > 0)
    .sort(
      (left, right) =>
        right.solved - left.solved ||
        right.attempted - left.attempted ||
        left.name.localeCompare(right.name),
    )
    .slice(0, 10);

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 364);
  const activity = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${submissions.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`,
      total: sql<number>`count(*)::int`,
      accepted: sql<number>`(count(*) filter (where ${submissions.status} = 'ACCEPTED'))::int`,
    })
    .from(submissions)
    .where(and(practiceSubmissions, gte(submissions.createdAt, start)))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const heatmap = buildHeatmap(activity);
  const submissionCount = Number(submissionRow?.value ?? 0);
  const acceptedCount = Number(acceptedRow?.value ?? 0);
  const rank = await getUserRank(user.id);
  // Deliberately not practice-filtered: the recent list keeps the existing
  // source-visibility rules and may show assessment attempts (E6).
  const recent = await listSubmissions(
    {
      page: 1,
      pageSize: 10,
      user: user.username,
      publicOnly: viewer?.role !== "ADMIN" && viewer?.id !== user.id,
    },
    viewer,
  );
  const ratingRows = await db
    .select({
      contestSlug: contests.slug,
      contestTitle: contests.title,
      rank: contestRatingChanges.rank,
      oldRating: contestRatingChanges.oldRating,
      newRating: contestRatingChanges.newRating,
      delta: contestRatingChanges.delta,
      createdAt: contestRatingChanges.createdAt,
    })
    .from(contestRatingChanges)
    .innerJoin(contests, eq(contests.id, contestRatingChanges.contestId))
    .where(eq(contestRatingChanges.userId, user.id))
    .orderBy(asc(contestRatingChanges.createdAt));

  const [
    problemSettingRow,
    contestCreateRow,
    editorialStats,
    learningBadges,
    socialSummary,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(problems)
      .where(eq(problems.authorId, user.id)),
    db
      .select({ value: count() })
      .from(contests)
      .where(eq(contests.createdBy, user.id)),
    getProfileEditorials(user.id),
    getLearningBadges(user.id),
    getProfileSocialSummary(user.id, viewer?.id ?? null),
  ]);

  const currentStreak = computeCurrentStreak(heatmap);
  const longestStreak = computeLongestStreak(heatmap);
  const activeDays = computeActiveDays(heatmap);
  const { ratedUserCount, ratingRank, ratingDistribution } =
    await getRatingRankStats(user.id, ratingRows.length > 0);
  const {
    solvedProblems,
    unsolvedProblems,
    attemptedCount,
    hardestTried,
    hardestSolved,
  } = buildProblemProgress(problemActivityRows);

  return {
    user: {
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      bio: user.bio,
      country: user.country,
      institution: user.institution,
      website: user.website,
      github: user.github,
      linkedin: user.linkedin,
      currentStatus: user.currentStatus,
      companyName: user.companyName,
      jobTitle: user.jobTitle,
      skills: user.skills ?? [],
      rating: user.rating,
      createdAt: user.createdAt.toISOString(),
      avatarPreset: user.avatarPreset,
      avatarImageUpdatedAt: user.avatarImageUpdatedAt?.toISOString() ?? null,
      isSelf: viewer?.id === user.id,
      followerCount: socialSummary.followerCount,
      followingCount: socialSummary.followingCount,
      isFollowing: socialSummary.isFollowing,
      canFollow: socialSummary.canFollow,
      requested: socialSummary.requested,
      incomingRequest: socialSummary.incomingRequest,
      blocked: socialSummary.blocked,
      blockedByViewer: socialSummary.blockedByViewer,
      canMessage: socialSummary.canMessage,
      presence: socialSummary.presence,
    },
    solvedCount: solvedRows.length,
    submissionCount,
    acceptedCount,
    acceptanceRate:
      submissionCount > 0 ? (acceptedCount / submissionCount) * 100 : 0,
    points,
    rank,
    ratingRank,
    ratedUserCount,
    ratingDistribution,
    currentStreak,
    longestStreak,
    activeDays,
    contestCount: ratingRows.length,
    ratingHistory: ratingRows.map((row) => ({
      contestSlug: row.contestSlug,
      contestTitle: row.contestTitle,
      rank: row.rank,
      oldRating: row.oldRating,
      newRating: row.newRating,
      delta: row.delta,
      createdAt: row.createdAt.toISOString(),
    })),
    languageStats,
    tagStats,
    verdictStats: verdictRows.map((row) => ({
      status: row.status,
      count: Number(row.value),
    })),
    solvedProblems,
    unsolvedProblems,
    attemptedCount,
    hardestTried,
    hardestSolved,
    problemSettingCount: Number(problemSettingRow?.[0]?.value ?? 0),
    contestCreateCount: Number(contestCreateRow?.[0]?.value ?? 0),
    approvedEditorialCount: editorialStats.count,
    approvedEditorials: editorialStats.editorials,
    learningBadges,
    achievements: buildAchievements({
      solvedCount: solvedRows.length,
      submissionCount,
      contestCount: ratingRows.length,
      rating: user.rating,
      longestStreak,
      acceptedLanguages: languageStats.filter((row) => row.accepted > 0).length,
    }),
    difficultySolved,
    difficultyTotals,
    heatmap,
    recentSubmissions: recent.items,
  };
}
