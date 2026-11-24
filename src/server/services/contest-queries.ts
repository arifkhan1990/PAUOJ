import { and, count, eq, gt, lte, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { contests } from "@/server/db/schema";
import type { ContestListStatusFilter } from "@/lib/contests";
import type { ContestFormat } from "@/lib/contest-ops";
import type { ContestDivision, ContestStatus } from "@/lib/types";

export type ContestFilter = "ALL" | ContestStatus;

export type ActiveContestContext = {
  contestId: string;
  slug: string;
  title: string;
  label: string;
  startAt: Date;
  endAt: Date;
};

export type ContestStatusCounts = Record<ContestListStatusFilter, number>;

export function participantCountSql() {
  return sql<number>`(select count(*)::int from contest_registrations cr where cr.contest_id = ${contests.id})`;
}

export function problemCountSql() {
  return sql<number>`(select count(*)::int from contest_problems cp where cp.contest_id = ${contests.id})`;
}

export function registeredSql(userId: string | null) {
  if (!userId) return sql<boolean>`false`;
  return sql<boolean>`exists(select 1 from contest_registrations cr where cr.contest_id = ${contests.id} and cr.user_id = ${userId})`;
}

export function statusCondition(filter: ContestFilter, now: Date) {
  if (filter === "UPCOMING") return gt(contests.startAt, now);
  if (filter === "RUNNING") {
    return and(lte(contests.startAt, now), gt(contests.endAt, now));
  }
  if (filter === "ENDED") return lte(contests.endAt, now);
  return undefined;
}

/**
 * One aggregate query for the hub's hero stats and filter-tab counts. The
 * optional format/division scope matches the visible list so counting never
 * disagrees with the rows underneath it.
 */
export async function contestStatusCounts(
  input: { division?: ContestDivision; format?: ContestFormat } = {},
): Promise<ContestStatusCounts> {
  const [row] = await getDb()
    .select({
      all: count(),
      running: sql<number>`count(*) filter (where ${contests.startAt} <= now() and ${contests.endAt} > now())`,
      upcoming: sql<number>`count(*) filter (where ${contests.startAt} > now())`,
      ended: sql<number>`count(*) filter (where ${contests.endAt} <= now())`,
    })
    .from(contests)
    .where(
      and(
        eq(contests.isPublic, true),
        input.division ? eq(contests.division, input.division) : undefined,
        input.format ? eq(contests.format, input.format) : undefined,
      ),
    );

  return {
    ALL: Number(row?.all ?? 0),
    RUNNING: Number(row?.running ?? 0),
    UPCOMING: Number(row?.upcoming ?? 0),
    ENDED: Number(row?.ended ?? 0),
  };
}
