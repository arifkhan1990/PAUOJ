import { and, gt, lte, sql } from "drizzle-orm";
import { contests } from "@/server/db/schema";
import type { ContestStatus } from "@/lib/types";

export type ContestFilter = "ALL" | ContestStatus;

export type ActiveContestContext = {
  contestId: string;
  slug: string;
  title: string;
  label: string;
  startAt: Date;
  endAt: Date;
};

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
