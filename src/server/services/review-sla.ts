import { and, eq, isNotNull, lte } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  contestProblemApprovals,
  contests,
  problemContributions,
  problems,
  users,
} from "@/server/db/schema";
import { REVIEW_SLA_HOURS, REVIEW_SLA_MS } from "@/lib/review-sla";
import { notifyUser } from "./notifications";

function inboxHref(role: "USER" | "TEACHER" | "ADMIN"): string {
  if (role === "ADMIN") return "/admin/contributions";
  if (role === "TEACHER") return "/teacher/contributions";
  return "/dashboard/contributions";
}

/**
 * Nudges authors whose review queue has items older than the SLA. Dedupe keys
 * make this safe to run on every worker sweep.
 */
export async function notifyOverdueReviews(): Promise<number> {
  const db = getDb();
  const cutoff = new Date(Date.now() - REVIEW_SLA_MS);
  let sent = 0;

  const contributions = await db
    .select({
      id: problemContributions.id,
      kind: problemContributions.kind,
      problemTitle: problems.title,
      authorId: problems.authorId,
      authorRole: users.role,
    })
    .from(problemContributions)
    .innerJoin(problems, eq(problems.id, problemContributions.problemId))
    .leftJoin(users, eq(users.id, problems.authorId))
    .where(
      and(
        eq(problemContributions.status, "PENDING"),
        lte(problemContributions.createdAt, cutoff),
        isNotNull(problems.authorId),
      ),
    )
    .limit(200);

  for (const row of contributions) {
    if (!row.authorId) continue;
    const created = await notifyUser({
      userId: row.authorId,
      type: "CONTRIBUTION",
      title: "Review overdue",
      body: `The ${row.kind.toLowerCase()} proposal for "${row.problemTitle}" has been waiting for over ${REVIEW_SLA_HOURS} hours.`,
      href: inboxHref(row.authorRole ?? "USER"),
      dedupeKey: `review-overdue:contribution:${row.id}`,
    });
    if (created) sent += 1;
  }

  const contestRequests = await db
    .select({
      id: contestProblemApprovals.id,
      contestTitle: contests.title,
      problemTitle: problems.title,
      authorId: contestProblemApprovals.authorId,
      authorRole: users.role,
    })
    .from(contestProblemApprovals)
    .innerJoin(contests, eq(contests.id, contestProblemApprovals.contestId))
    .innerJoin(problems, eq(problems.id, contestProblemApprovals.problemId))
    .leftJoin(users, eq(users.id, contestProblemApprovals.authorId))
    .where(
      and(
        eq(contestProblemApprovals.status, "PENDING"),
        lte(contestProblemApprovals.createdAt, cutoff),
        isNotNull(contestProblemApprovals.authorId),
      ),
    )
    .limit(200);

  for (const row of contestRequests) {
    if (!row.authorId) continue;
    const created = await notifyUser({
      userId: row.authorId,
      type: "CONTEST_APPROVAL",
      title: "Contest request overdue",
      body: `"${row.contestTitle}" has been waiting for your approval to use "${row.problemTitle}" for over ${REVIEW_SLA_HOURS} hours.`,
      href: inboxHref(row.authorRole ?? "USER"),
      dedupeKey: `review-overdue:contest:${row.id}`,
    });
    if (created) sent += 1;
  }

  return sent;
}
