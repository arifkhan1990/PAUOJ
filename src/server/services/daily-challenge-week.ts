import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "@/server/db";
import { submissions } from "@/server/db/schema";
import type { Difficulty } from "@/lib/difficulty";
import {
  addUtcDays,
  formatWeekLabel,
  startOfUtcWeek,
  utcDayKey,
} from "@/lib/week";
import {
  findDailyChallengeProblem,
  loadDailyChallengeScope,
  type DailyChallengeProblem,
} from "./daily-challenge";
import { countedSubmission } from "./submission-filters";

export type DailyChallengeWeekProblem = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
};

export type DailyChallengeWeekDay = {
  date: string;
  problem: DailyChallengeWeekProblem | null;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
  isBeforeJoin: boolean;
};

export type DailyChallengeWeek = {
  anchor: string;
  label: string;
  fullLabel: string;
  days: DailyChallengeWeekDay[];
  completedCount: number;
};

export function buildDailyChallengeWeek(input: {
  anchor: Date;
  now: Date;
  joinedAt?: Date;
  problemsByDate: Map<string, DailyChallengeProblem>;
  completedKeys: Set<string>;
}): DailyChallengeWeek {
  const weekStart = startOfUtcWeek(input.anchor);
  const todayKey = utcDayKey(input.now);
  const joinKey = input.joinedAt ? utcDayKey(input.joinedAt) : null;
  const days: DailyChallengeWeekDay[] = [];
  let completedCount = 0;

  for (let offset = 0; offset < 7; offset += 1) {
    const date = utcDayKey(addUtcDays(weekStart, offset));
    const isFuture = date > todayKey;
    const isBeforeJoin = joinKey !== null && date < joinKey;
    const problem = isFuture || isBeforeJoin
      ? null
      : (input.problemsByDate.get(date) ?? null);
    const completed = Boolean(
      problem && input.completedKeys.has(`${date}:${problem.id}`),
    );
    if (completed) completedCount += 1;

    days.push({
      date,
      problem: problem
        ? {
            slug: problem.slug,
            title: problem.title,
            difficulty: problem.difficulty,
            points: problem.points,
          }
        : null,
      completed,
      isToday: date === todayKey,
      isFuture,
      isBeforeJoin,
    });
  }

  const end = addUtcDays(weekStart, 6);
  return {
    anchor: utcDayKey(weekStart),
    label: formatWeekLabel(weekStart, end, "short"),
    fullLabel: formatWeekLabel(weekStart, end),
    days,
    completedCount,
  };
}

export async function getDailyChallengeWeek(input: {
  userId: string;
  isAdmin: boolean;
  anchor: Date;
  now?: Date;
  joinedAt?: Date;
}): Promise<DailyChallengeWeek> {
  const now = input.now ?? new Date();
  const weekStart = startOfUtcWeek(input.anchor);
  const todayKey = utcDayKey(now);
  const joinKey = input.joinedAt ? utcDayKey(input.joinedAt) : null;
  const dates = Array.from({ length: 7 }, (_, offset) =>
    utcDayKey(addUtcDays(weekStart, offset)),
  );
  const scope = await loadDailyChallengeScope(input.userId, input.isAdmin);

  const problemsByDate = new Map<string, DailyChallengeProblem>();
  await Promise.all(
    dates.map(async (date) => {
      if (date > todayKey) return;
      if (joinKey !== null && date < joinKey) return;
      const problem = await findDailyChallengeProblem(scope, date);
      if (problem) problemsByDate.set(date, problem);
    }),
  );

  const problemIds = [
    ...new Set([...problemsByDate.values()].map((problem) => problem.id)),
  ];
  const completedKeys = new Set<string>();
  if (problemIds.length > 0) {
    const rows = await getDb()
      .select({
        problemId: submissions.problemId,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .where(
        and(
          eq(submissions.userId, input.userId),
          eq(submissions.status, "ACCEPTED"),
          countedSubmission(),
          inArray(submissions.problemId, problemIds),
          gte(submissions.createdAt, weekStart),
          lt(submissions.createdAt, addUtcDays(weekStart, 7)),
        ),
      );
    for (const row of rows) {
      completedKeys.add(`${utcDayKey(row.createdAt)}:${row.problemId}`);
    }
  }

  return buildDailyChallengeWeek({
    anchor: weekStart,
    now,
    joinedAt: input.joinedAt,
    problemsByDate,
    completedKeys,
  });
}
