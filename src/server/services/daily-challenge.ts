import { and, asc, count, eq, gte, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { problemTags, problems, submissions, tags } from "@/server/db/schema";
import type { Difficulty, ProblemTag } from "@/lib/types";
import {
  buildHeatmap,
  computeCurrentStreak,
} from "./activity";
import { getRestrictedProblemIds } from "./problem-access";
import { countedSubmission } from "./submission-filters";

export type DailyChallenge = {
  date: string;
  problem: {
    slug: string;
    title: string;
    difficulty: Difficulty;
    points: number;
    tags: ProblemTag[];
  };
  solvedToday: boolean;
  streak: number;
};

function startOfDay(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export async function getDailyChallenge(
  userId: string | null,
  isAdmin: boolean,
): Promise<DailyChallenge | null> {
  const db = getDb();
  const dayStart = startOfDay();
  const dateKey = dayStart.toISOString().slice(0, 10);
  const restricted = await getRestrictedProblemIds(userId, isAdmin);
  const conditions = [eq(problems.isPublic, true)];
  if (restricted.length > 0) {
    conditions.push(notInArray(problems.id, restricted));
  }

  const [problem] = await db
    .select({
      id: problems.id,
      slug: problems.slug,
      title: problems.title,
      difficulty: problems.difficulty,
      points: problems.points,
    })
    .from(problems)
    .where(and(...conditions))
    .orderBy(sql`md5(${problems.id}::text || ${dateKey})`)
    .limit(1);
  if (!problem) return null;

  const problemTagRows = await db
    .select({ name: tags.name, slug: tags.slug })
    .from(problemTags)
    .innerJoin(tags, eq(tags.id, problemTags.tagId))
    .where(eq(problemTags.problemId, problem.id))
    .orderBy(asc(tags.name));

  let solvedToday = false;
  let streak = 0;
  if (userId) {
    const [solvedRow] = await db
      .select({ value: count() })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.problemId, problem.id),
          eq(submissions.status, "ACCEPTED"),
          gte(submissions.createdAt, dayStart),
          countedSubmission(),
        ),
      );
    solvedToday = Number(solvedRow?.value ?? 0) > 0;

    const start = new Date(dayStart);
    start.setUTCDate(start.getUTCDate() - 364);
    const activity = await db
      .select({
        date: sql<string>`to_char(date_trunc('day', ${submissions.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`,
        total: sql<number>`count(*)::int`,
        accepted: sql<number>`(count(*) filter (where ${submissions.status} = 'ACCEPTED'))::int`,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, userId),
          gte(submissions.createdAt, start),
          countedSubmission(),
        ),
      )
      .groupBy(sql`1`)
      .orderBy(sql`1`);
    streak = computeCurrentStreak(buildHeatmap(activity));
  }

  return {
    date: dateKey,
    problem: {
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
      points: problem.points,
      tags: problemTagRows,
    },
    solvedToday,
    streak,
  };
}
