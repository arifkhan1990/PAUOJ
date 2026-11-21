import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { problemReviewApprovals, problems, users } from "@/server/db/schema";
import { logger } from "@/server/logger";
import { REQUIRED_PUBLICATION_APPROVALS } from "@/lib/problem-review-types";
import type { UserRole } from "@/lib/types";
import { notifyUser } from "./notifications";

type Recipient = { id: string; role: UserRole };

type ProblemSummary = {
  id: string;
  title: string;
  authorId: string | null;
  authorRole: UserRole | null;
};

export function reviewHref(
  problemId: string,
  role: UserRole | null | undefined,
): string {
  if (role === "ADMIN") return `/admin/reviews/${problemId}`;
  if (role === "TEACHER") return `/teacher/reviews/${problemId}`;
  return `/dashboard/reviews/${problemId}`;
}

function dedupeKey(
  problemId: string,
  cycle: number,
  event: string,
  holdId?: string,
): string {
  return `problem-review:${problemId}:${cycle}:${event}${
    holdId ? `:${holdId}` : ""
  }`;
}

async function loadProblemSummary(
  problemId: string,
): Promise<ProblemSummary | null> {
  const [row] = await getDb()
    .select({
      id: problems.id,
      title: problems.title,
      authorId: problems.authorId,
      authorRole: users.role,
    })
    .from(problems)
    .leftJoin(users, eq(users.id, problems.authorId))
    .where(eq(problems.id, problemId))
    .limit(1);
  return row ?? null;
}

async function staffRecipients(
  excludeIds: (string | null)[] = [],
): Promise<Recipient[]> {
  const rows = await getDb()
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(
      and(
        inArray(users.role, ["TEACHER", "ADMIN"]),
        eq(users.isBanned, false),
      ),
    );
  const excluded = new Set(excludeIds.filter((id): id is string => !!id));
  return rows.filter((row) => !excluded.has(row.id));
}

async function sendReviewNotifications(
  recipients: Recipient[],
  input: { title: string; body: string; problemId: string; dedupeKey: string },
): Promise<void> {
  const seen = new Set<string>();
  for (const recipient of recipients) {
    if (seen.has(recipient.id)) continue;
    seen.add(recipient.id);
    await notifyUser({
      userId: recipient.id,
      type: "CONTRIBUTION",
      title: input.title,
      body: input.body,
      href: reviewHref(input.problemId, recipient.role),
      dedupeKey: input.dedupeKey,
    });
  }
}

async function safely(
  label: string,
  run: () => Promise<void>,
): Promise<void> {
  try {
    await run();
  } catch (error) {
    logger.warn(`Problem review notification failed: ${label}`, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function authorRecipient(summary: ProblemSummary): Recipient[] {
  if (!summary.authorId) return [];
  return [{ id: summary.authorId, role: summary.authorRole ?? "USER" }];
}

export async function notifyProblemReviewRequested(
  problemId: string,
  cycle: number,
): Promise<void> {
  await safely("submit", async () => {
    const summary = await loadProblemSummary(problemId);
    if (!summary) return;
    const recipients = await staffRecipients([summary.authorId]);
    await sendReviewNotifications(recipients, {
      problemId,
      title: "New problem needs review",
      body: `"${summary.title}" was submitted for publication review. Two setters must approve it before it becomes public.`,
      dedupeKey: dedupeKey(problemId, cycle, "submit"),
    });
  });
}

export async function notifyProblemReviewApproved(input: {
  problemId: string;
  cycle: number;
  actorId: string;
  actorName: string;
  approvalCount: number;
}): Promise<void> {
  await safely("approve", async () => {
    const summary = await loadProblemSummary(input.problemId);
    if (!summary) return;
    const remaining = Math.max(
      REQUIRED_PUBLICATION_APPROVALS - input.approvalCount,
      0,
    );
    const recipients = authorRecipient(summary);
    await sendReviewNotifications(recipients, {
      problemId: input.problemId,
      title: "Problem review approval",
      body: `${input.actorName} approved "${summary.title}" (${input.approvalCount} of ${REQUIRED_PUBLICATION_APPROVALS} approvals).${
        remaining > 0
          ? ` ${remaining} more setter approval${remaining === 1 ? "" : "s"} needed.`
          : " All setter approvals are in; remaining gates are listed in the review workspace."
      }`,
      dedupeKey: dedupeKey(
        input.problemId,
        input.cycle,
        `approve:${input.actorId}`,
      ),
    });
  });
}

export async function notifyProblemRereviewStarted(input: {
  problemId: string;
  cycle: number;
  actorId: string;
  actorName: string;
  note: string;
}): Promise<void> {
  await safely("rereview", async () => {
    const summary = await loadProblemSummary(input.problemId);
    if (!summary) return;
    const recipients = await staffRecipients([input.actorId]);
    recipients.push(...authorRecipient(summary));
    await sendReviewNotifications(recipients, {
      problemId: input.problemId,
      title: "Published problem withdrawn for re-review",
      body: `${input.actorName} started a re-review of "${summary.title}". It is hidden from the public list until it passes the two-setter gate again. ${input.note}`,
      dedupeKey: dedupeKey(input.problemId, input.cycle, "rereview"),
    });
  });
}

export async function notifyProblemReviewHeld(input: {
  problemId: string;
  cycle: number;
  holdId: string;
  actorId: string;
  actorName: string;
  note: string;
}): Promise<void> {
  await safely("hold", async () => {
    const summary = await loadProblemSummary(input.problemId);
    if (!summary) return;
    const recipients = await staffRecipients([
      input.actorId,
      summary.authorId,
    ]);
    recipients.push(...authorRecipient(summary));
    await sendReviewNotifications(recipients, {
      problemId: input.problemId,
      title: "Problem review put on hold",
      body: `${input.actorName} put "${summary.title}" on hold. ${input.note}`,
      dedupeKey: dedupeKey(
        input.problemId,
        input.cycle,
        "hold",
        input.holdId,
      ),
    });
  });
}

export async function notifyProblemReviewResponded(input: {
  problemId: string;
  cycle: number;
  holdId: string;
  actorName: string;
  response: string;
  respondedAt: Date;
}): Promise<void> {
  await safely("respond", async () => {
    const summary = await loadProblemSummary(input.problemId);
    if (!summary) return;
    const recipients = await staffRecipients();
    await sendReviewNotifications(recipients, {
      problemId: input.problemId,
      title: "Author responded to a review hold",
      body: `${input.actorName} responded on "${summary.title}". ${input.response}`,
      dedupeKey: dedupeKey(
        input.problemId,
        input.cycle,
        `respond:${input.respondedAt.getTime()}`,
        input.holdId,
      ),
    });
  });
}

export async function notifyProblemReviewResolved(input: {
  problemId: string;
  cycle: number;
  holdId: string;
  actorName: string;
  note?: string;
  reopened: boolean;
}): Promise<void> {
  await safely("resolve", async () => {
    const summary = await loadProblemSummary(input.problemId);
    if (!summary) return;
    const recipients = authorRecipient(summary);
    if (input.reopened) {
      recipients.push(...(await staffRecipients([summary.authorId])));
    }
    await sendReviewNotifications(recipients, {
      problemId: input.problemId,
      title: input.reopened
        ? "Hold resolved; problem back in review"
        : "Hold resolved",
      body: `${input.actorName} resolved the hold on "${summary.title}".${
        input.note ? ` ${input.note}` : ""
      }${input.reopened ? " The problem is open for approvals again." : ""}`,
      dedupeKey: dedupeKey(
        input.problemId,
        input.cycle,
        "resolve",
        input.holdId,
      ),
    });
  });
}

export async function notifyProblemReviewReopened(input: {
  problemId: string;
  cycle: number;
  holdId: string;
  actorName: string;
  note: string;
}): Promise<void> {
  await safely("reopen", async () => {
    const summary = await loadProblemSummary(input.problemId);
    if (!summary) return;
    const recipients = authorRecipient(summary);
    await sendReviewNotifications(recipients, {
      problemId: input.problemId,
      title: "Problem hold reopened",
      body: `${input.actorName} reopened the hold on "${summary.title}". ${input.note}`,
      dedupeKey: dedupeKey(
        input.problemId,
        input.cycle,
        "reopen",
        input.holdId,
      ),
    });
  });
}

export async function notifyProblemPublished(
  problemId: string,
  cycle: number,
): Promise<void> {
  await safely("publish", async () => {
    const summary = await loadProblemSummary(problemId);
    if (!summary) return;
    const approvers = await getDb()
      .select({ id: users.id, role: users.role })
      .from(problemReviewApprovals)
      .innerJoin(users, eq(users.id, problemReviewApprovals.reviewerId))
      .where(
        and(
          eq(problemReviewApprovals.problemId, problemId),
          eq(problemReviewApprovals.cycle, cycle),
          eq(problemReviewApprovals.status, "ACTIVE"),
        ),
      );
    const recipients = [...authorRecipient(summary), ...approvers];
    await sendReviewNotifications(recipients, {
      problemId,
      title: "Problem published",
      body: `"${summary.title}" passed review and is now visible in the public problem list. Thanks for reviewing it.`,
      dedupeKey: dedupeKey(problemId, cycle, "publish"),
    });
  });
}
