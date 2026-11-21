import { and, count, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { problems, submissions, users } from "@/server/db/schema";
import type { HeatmapDay, SiteStats } from "@/lib/types";
import { buildHeatmap } from "./activity";
import { countedSubmission } from "./submission-filters";

export async function getSiteStats(): Promise<SiteStats> {
  const db = getDb();
  const [problemRow, userRow, submissionRow, acceptedRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(problems)
      .where(eq(problems.isPublic, true)),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(submissions).where(countedSubmission()),
    db
      .select({ value: count() })
      .from(submissions)
      .where(and(eq(submissions.status, "ACCEPTED"), countedSubmission())),
  ]);

  return {
    problemCount: Number(problemRow[0]?.value ?? 0),
    userCount: Number(userRow[0]?.value ?? 0),
    submissionCount: Number(submissionRow[0]?.value ?? 0),
    acceptedCount: Number(acceptedRow[0]?.value ?? 0),
  };
}

export async function getSubmissionActivity(days = 14): Promise<HeatmapDay[]> {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  const rows = await getDb()
    .select({
      date: sql<string>`to_char(date_trunc('day', ${submissions.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`,
      total: sql<number>`count(*)::int`,
      accepted: sql<number>`(count(*) filter (where ${submissions.status} = 'ACCEPTED'))::int`,
    })
    .from(submissions)
    .where(and(gte(submissions.createdAt, start), countedSubmission()))
    .groupBy(sql`1`)
    .orderBy(sql`1`);
  return buildHeatmap(rows, days);
}
