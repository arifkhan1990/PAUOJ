import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { contestSeries, contests } from "@/server/db/schema";
import { isUniqueViolation } from "@/lib/db-errors";
import {
  MONTHLY_ELIGIBILITY,
  MONTHLY_PRIZES,
  MONTHLY_RULES,
} from "@/lib/contest-content";
import {
  MONTHLY_SERIES_SCHEDULE,
  monthlySeriesDescription,
  monthlySeriesEnd,
  monthlySeriesSlug,
  monthlySeriesTitle,
  nextMonthlySeriesStart,
  type MonthlySeriesSchedule,
} from "@/lib/contest-schedule";
import type { ContestSeriesView } from "@/lib/contest-ops";
import type { SafeUser } from "@/server/auth/session";

export const MONTHLY_CONTEST_SERIES_KEY = "monthly-third-sunday";
const SERIES_TITLE = "PAU Monthly Contest";
const SERIES_MIN_DURATION_MINUTES = 10;
const SERIES_MAX_DURATION_MINUTES = 300;

function scheduleOf(row: {
  weekday: number;
  weekOfMonth: number;
  hour: number;
  minute: number;
  durationMinutes: number;
}): MonthlySeriesSchedule {
  return {
    weekday: row.weekday,
    weekOfMonth: row.weekOfMonth,
    hour: row.hour,
    minute: row.minute,
    durationMinutes: row.durationMinutes,
  };
}

function mapSeries(row: typeof contestSeries.$inferSelect): ContestSeriesView {
  return {
    id: row.id,
    key: row.key,
    title: row.title,
    description: row.description,
    format: row.format,
    division: row.division,
    cadence: row.cadence,
    timezone: row.timezone,
    weekOfMonth: row.weekOfMonth,
    weekday: row.weekday,
    hour: row.hour,
    minute: row.minute,
    durationMinutes: row.durationMinutes,
    teamSize: row.teamSize,
    isActive: row.isActive,
    nextRunAt: row.nextRunAt?.toISOString() ?? null,
    lastRunAt: row.lastRunAt?.toISOString() ?? null,
  };
}

/**
 * The single official series row. Inserts the default row once; never
 * overwrites admin edits such as the hour or the active flag.
 */
async function loadOrCreateSeries() {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(contestSeries)
    .where(eq(contestSeries.key, MONTHLY_CONTEST_SERIES_KEY))
    .limit(1);
  if (existing) return existing;

  await db
    .insert(contestSeries)
    .values({
      key: MONTHLY_CONTEST_SERIES_KEY,
      title: SERIES_TITLE,
      description: monthlySeriesDescription(),
      format: "SINGLE",
      division: "OPEN",
      cadence: "MONTHLY_THIRD_SUNDAY",
      timezone: "Asia/Dhaka",
      weekOfMonth: MONTHLY_SERIES_SCHEDULE.weekOfMonth,
      weekday: MONTHLY_SERIES_SCHEDULE.weekday,
      hour: MONTHLY_SERIES_SCHEDULE.hour,
      minute: MONTHLY_SERIES_SCHEDULE.minute,
      durationMinutes: MONTHLY_SERIES_SCHEDULE.durationMinutes,
      teamSize: 3,
      isActive: true,
    })
    .onConflictDoNothing({ target: contestSeries.key });

  const [row] = await db
    .select()
    .from(contestSeries)
    .where(eq(contestSeries.key, MONTHLY_CONTEST_SERIES_KEY))
    .limit(1);
  if (!row) throw errors.unavailable("Could not load the monthly contest series.");
  return row;
}

async function markScheduled(seriesId: string, created: boolean, startAt: Date) {
  const now = new Date();
  await getDb()
    .update(contestSeries)
    .set({
      nextRunAt: startAt,
      // Timestamp of the most recent generation, not the future start time.
      lastRunAt: created ? now : undefined,
      updatedAt: now,
    })
    .where(eq(contestSeries.id, seriesId));
}

/**
 * Idempotently ensures the next monthly occurrence exists. Safe to call from
 * concurrent worker runs: the `(series_id, start_at)` unique index wins.
 */
export async function ensureMonthlyContestSeries(
  now: Date = new Date(),
): Promise<{ created: boolean; contestId: string; startAt: string }> {
  const db = getDb();
  const series = await loadOrCreateSeries();
  const schedule = scheduleOf(series);
  const startAt = nextMonthlySeriesStart(now, schedule);

  if (!series.isActive) {
    const [upcoming] = await db
      .select({ id: contests.id, startAt: contests.startAt })
      .from(contests)
      .where(
        and(
          eq(contests.seriesId, series.id),
          gte(contests.startAt, startAt),
        ),
      )
      .orderBy(asc(contests.startAt))
      .limit(1);
    if (upcoming) {
      return {
        created: false,
        contestId: upcoming.id,
        startAt: upcoming.startAt.toISOString(),
      };
    }
    const [latest] = await db
      .select({ id: contests.id, startAt: contests.startAt })
      .from(contests)
      .where(eq(contests.seriesId, series.id))
      .orderBy(desc(contests.startAt))
      .limit(1);
    if (latest) {
      return {
        created: false,
        contestId: latest.id,
        startAt: latest.startAt.toISOString(),
      };
    }
    throw errors.conflict("The monthly contest series is paused.");
  }

  const [existing] = await db
    .select({ id: contests.id })
    .from(contests)
    .where(
      and(eq(contests.seriesId, series.id), eq(contests.startAt, startAt)),
    )
    .limit(1);
  if (existing) {
    // Fill missing public copy for earlier auto-created rounds without
    // overwriting a director's edited eligibility/rules/prizes.
    await db
      .update(contests)
      .set({
        eligibility: sql`coalesce(${contests.eligibility}, ${MONTHLY_ELIGIBILITY})`,
        rules: sql`coalesce(${contests.rules}, ${MONTHLY_RULES})`,
        prizes: sql`coalesce(${contests.prizes}, ${MONTHLY_PRIZES})`,
        updatedAt: new Date(),
      })
      .where(eq(contests.id, existing.id));
    await markScheduled(series.id, false, startAt);
    return {
      created: false,
      contestId: existing.id,
      startAt: startAt.toISOString(),
    };
  }

  const baseSlug = monthlySeriesSlug(startAt);
  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const [created] = await db
        .insert(contests)
        .values({
          slug,
          title: monthlySeriesTitle(startAt),
          description: monthlySeriesDescription(),
          startAt,
          endAt: monthlySeriesEnd(startAt, schedule),
          isPublic: true,
          division: series.division,
          format: series.format,
          teamSize: series.teamSize,
          seriesId: series.id,
          isOfficial: true,
          autoCreated: true,
          requiresFreshProblems: true,
          eligibility: MONTHLY_ELIGIBILITY,
          rules: MONTHLY_RULES,
          prizes: MONTHLY_PRIZES,
          createdBy: series.createdBy,
        })
        .onConflictDoNothing()
        .returning({ id: contests.id });
      if (created) {
        await markScheduled(series.id, true, startAt);
        return {
          created: true,
          contestId: created.id,
          startAt: startAt.toISOString(),
        };
      }
      const [raced] = await db
        .select({ id: contests.id })
        .from(contests)
        .where(
          and(eq(contests.seriesId, series.id), eq(contests.startAt, startAt)),
        )
        .limit(1);
      if (raced) {
        await markScheduled(series.id, false, startAt);
        return {
          created: false,
          contestId: raced.id,
          startAt: startAt.toISOString(),
        };
      }
    }
  } catch (error) {
    // Belt and braces for a concurrent worker losing the insert race.
    if (!isUniqueViolation(error)) throw error;
    const [raced] = await db
      .select({ id: contests.id })
      .from(contests)
      .where(
        and(eq(contests.seriesId, series.id), eq(contests.startAt, startAt)),
      )
      .limit(1);
    if (raced) {
      await markScheduled(series.id, false, startAt);
      return {
        created: false,
        contestId: raced.id,
        startAt: startAt.toISOString(),
      };
    }
    throw error;
  }
  throw errors.conflict("Could not create the monthly contest occurrence.");
}

export async function listContestSeries(): Promise<ContestSeriesView[]> {
  // The singleton row is seeded on first read so the admin page always has it.
  await loadOrCreateSeries();
  const rows = await getDb()
    .select()
    .from(contestSeries)
    .orderBy(asc(contestSeries.createdAt));
  return rows.map(mapSeries);
}

export async function updateContestSeries(
  actor: SafeUser,
  input: {
    isActive: boolean;
    hour?: number;
    minute?: number;
    durationMinutes?: number;
  },
): Promise<ContestSeriesView[]> {
  if (actor.role !== "ADMIN") {
    throw errors.forbidden("Only an admin can change the contest series.");
  }
  const series = await loadOrCreateSeries();
  if (
    input.durationMinutes !== undefined &&
    (!Number.isInteger(input.durationMinutes) ||
      input.durationMinutes < SERIES_MIN_DURATION_MINUTES ||
      input.durationMinutes > SERIES_MAX_DURATION_MINUTES)
  ) {
    throw errors.validation(
      `Series length must be between ${SERIES_MIN_DURATION_MINUTES} and ${SERIES_MAX_DURATION_MINUTES} minutes.`,
    );
  }
  if (
    input.hour !== undefined &&
    (!Number.isInteger(input.hour) || input.hour < 0 || input.hour > 23)
  ) {
    throw errors.validation("Pick an hour between 0 and 23.");
  }
  if (
    input.minute !== undefined &&
    (!Number.isInteger(input.minute) || input.minute < 0 || input.minute > 59)
  ) {
    throw errors.validation("Pick a minute between 0 and 59.");
  }

  const schedule: MonthlySeriesSchedule = {
    weekday: series.weekday,
    weekOfMonth: series.weekOfMonth,
    hour: input.hour ?? series.hour,
    minute: input.minute ?? series.minute,
    durationMinutes: input.durationMinutes ?? series.durationMinutes,
  };
  const now = new Date();
  await getDb()
    .update(contestSeries)
    .set({
      isActive: input.isActive,
      hour: schedule.hour,
      minute: schedule.minute,
      durationMinutes: schedule.durationMinutes,
      nextRunAt: input.isActive ? nextMonthlySeriesStart(now, schedule) : null,
      updatedAt: now,
    })
    .where(eq(contestSeries.id, series.id));

  return listContestSeries();
}
