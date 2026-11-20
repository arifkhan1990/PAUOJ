import { and, count, desc, eq, inArray, ne, notInArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Database } from "@/server/db";
import { getDb } from "@/server/db";
import {
  contestProblemApprovals,
  contests,
  problems,
  users,
} from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import type {
  ContestProblemApprovalItem,
  ContestProblemApprovalSummary,
} from "@/lib/contest-approval-types";
import type { ContestApprovalDecisionInput } from "@/lib/schemas/contest-approval";
import type { SafeUser } from "@/server/auth/session";
import { notifyUser } from "./notifications";

type Transaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];
type Executor = Database | Transaction;
const requesterUser = alias(users, "approval_requester");
const reviewerUser = alias(users, "approval_reviewer");

function approvalQuery() {
  return getDb()
    .select({
      id: contestProblemApprovals.id,
      contestId: contestProblemApprovals.contestId,
      contestSlug: contests.slug,
      contestTitle: contests.title,
      contestStartAt: contests.startAt,
      problemId: contestProblemApprovals.problemId,
      problemSlug: problems.slug,
      problemTitle: problems.title,
      status: contestProblemApprovals.status,
      reviewNote: contestProblemApprovals.reviewNote,
      reviewedAt: contestProblemApprovals.reviewedAt,
      createdAt: contestProblemApprovals.createdAt,
      requesterUsername: requesterUser.username,
      requesterDisplayName: requesterUser.displayName,
      reviewerUsername: reviewerUser.username,
      reviewerDisplayName: reviewerUser.displayName,
    })
    .from(contestProblemApprovals)
    .innerJoin(contests, eq(contests.id, contestProblemApprovals.contestId))
    .innerJoin(problems, eq(problems.id, contestProblemApprovals.problemId))
    .leftJoin(
      requesterUser,
      eq(requesterUser.id, contestProblemApprovals.requestedById),
    )
    .leftJoin(
      reviewerUser,
      eq(reviewerUser.id, contestProblemApprovals.reviewedById),
    );
}

type ApprovalRow = Awaited<ReturnType<typeof approvalQuery>>[number];

function mapApproval(row: ApprovalRow): ContestProblemApprovalItem {
  return {
    id: row.id,
    contestId: row.contestId,
    contestSlug: row.contestSlug,
    contestTitle: row.contestTitle,
    contestStartAt: row.contestStartAt.toISOString(),
    problemId: row.problemId,
    problemSlug: row.problemSlug,
    problemTitle: row.problemTitle,
    status: row.status,
    reviewNote: row.reviewNote,
    requester:
      row.requesterUsername && row.requesterDisplayName
        ? {
            username: row.requesterUsername,
            displayName: row.requesterDisplayName,
          }
        : null,
    reviewer:
      row.reviewerUsername && row.reviewerDisplayName
        ? {
            username: row.reviewerUsername,
            displayName: row.reviewerDisplayName,
          }
        : null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export type ContestApprovalRequest = {
  approvalId: string;
  authorId: string;
  authorRole: "USER" | "TEACHER" | "ADMIN";
  problemTitle: string;
  contestId: string;
  contestTitle: string;
};

function inboxHrefForRole(role: string | null | undefined): string {
  if (role === "ADMIN") return "/admin/contributions";
  if (role === "TEACHER") return "/teacher/contributions";
  return "/dashboard/contributions";
}

export async function syncContestProblemApprovals(
  tx: Transaction,
  input: {
    contestId: string;
    contestTitle: string;
    problemIds: string[];
    actor: Pick<SafeUser, "id" | "role">;
  },
): Promise<ContestApprovalRequest[]> {
  const problemRows = await tx
    .select({
      id: problems.id,
      title: problems.title,
      authorId: problems.authorId,
      authorRole: users.role,
    })
    .from(problems)
    .leftJoin(users, eq(users.id, problems.authorId))
    .where(inArray(problems.id, input.problemIds));

  const existing = await tx
    .select()
    .from(contestProblemApprovals)
    .where(eq(contestProblemApprovals.contestId, input.contestId));
  const existingByProblem = new Map(
    existing.map((row) => [row.problemId, row]),
  );

  if (input.problemIds.length > 0) {
    await tx
      .delete(contestProblemApprovals)
      .where(
        and(
          eq(contestProblemApprovals.contestId, input.contestId),
          notInArray(contestProblemApprovals.problemId, input.problemIds),
        ),
      );
  }

  const requests: ContestApprovalRequest[] = [];
  const now = new Date();
  for (const problem of problemRows) {
    const existingRow = existingByProblem.get(problem.id);
    if (existingRow) {
      if (input.actor.role === "ADMIN" && existingRow.status !== "APPROVED") {
        await tx
          .update(contestProblemApprovals)
          .set({
            status: "APPROVED",
            reviewedById: input.actor.id,
            reviewedAt: now,
            updatedAt: now,
          })
          .where(eq(contestProblemApprovals.id, existingRow.id));
      }
      continue;
    }
    const autoApprove =
      input.actor.role === "ADMIN" ||
      !problem.authorId ||
      problem.authorId === input.actor.id;
    const [created] = await tx
      .insert(contestProblemApprovals)
      .values({
        contestId: input.contestId,
        problemId: problem.id,
        authorId: problem.authorId,
        requestedById: input.actor.id,
        status: autoApprove ? "APPROVED" : "PENDING",
        reviewedById: autoApprove ? input.actor.id : null,
        reviewedAt: autoApprove ? now : null,
        updatedAt: now,
      })
      .returning({ id: contestProblemApprovals.id });
    if (!autoApprove && created && problem.authorId) {
      requests.push({
        approvalId: created.id,
        authorId: problem.authorId,
        authorRole: problem.authorRole ?? "USER",
        problemTitle: problem.title,
        contestId: input.contestId,
        contestTitle: input.contestTitle,
      });
    }
  }
  return requests;
}

export async function countUnapprovedContestProblems(
  contestId: string,
  executor: Executor = getDb(),
): Promise<number> {
  const [row] = await executor
    .select({ value: count() })
    .from(contestProblemApprovals)
    .where(
      and(
        eq(contestProblemApprovals.contestId, contestId),
        ne(contestProblemApprovals.status, "APPROVED"),
      ),
    );
  return Number(row?.value ?? 0);
}

export async function listContestApprovalSummaries(
  contestId: string,
): Promise<ContestProblemApprovalSummary[]> {
  const rows = await getDb()
    .select({
      problemId: contestProblemApprovals.problemId,
      problemTitle: problems.title,
      status: contestProblemApprovals.status,
      reviewNote: contestProblemApprovals.reviewNote,
    })
    .from(contestProblemApprovals)
    .innerJoin(problems, eq(problems.id, contestProblemApprovals.problemId))
    .where(eq(contestProblemApprovals.contestId, contestId))
    .orderBy(problems.title);
  return rows;
}

export async function listUnapprovedContestProblems(
  contestId: string,
  executor: Executor = getDb(),
): Promise<
  { problemTitle: string; status: "PENDING" | "REJECTED" }[]
> {
  const rows = await executor
    .select({
      problemTitle: problems.title,
      status: contestProblemApprovals.status,
    })
    .from(contestProblemApprovals)
    .innerJoin(problems, eq(problems.id, contestProblemApprovals.problemId))
    .where(
      and(
        eq(contestProblemApprovals.contestId, contestId),
        ne(contestProblemApprovals.status, "APPROVED"),
      ),
    )
    .orderBy(problems.title);
  return rows.filter(
    (row): row is { problemTitle: string; status: "PENDING" | "REJECTED" } =>
      row.status !== "APPROVED",
  );
}

export async function notifyContestApprovalRequests(
  requests: ContestApprovalRequest[],
  requesterName: string,
): Promise<void> {
  for (const request of requests) {
    await notifyUser({
      userId: request.authorId,
      type: "CONTEST_APPROVAL",
      title: "Contest problem approval needed",
      body: `${requesterName} wants to use "${request.problemTitle}" in "${request.contestTitle}". Review the request before the contest is published.`,
      href: inboxHrefForRole(request.authorRole),
      dedupeKey: `contest-approval:${request.approvalId}:request`,
    });
  }
}

export async function listContestApprovalInbox(
  reviewer: Pick<SafeUser, "id" | "role">,
  limit = 50,
): Promise<ContestProblemApprovalItem[]> {
  const rows = await approvalQuery()
    .where(
      and(
        eq(contestProblemApprovals.status, "PENDING"),
        reviewer.role === "ADMIN"
          ? undefined
          : eq(contestProblemApprovals.authorId, reviewer.id),
      ),
    )
    .orderBy(desc(contestProblemApprovals.createdAt))
    .limit(limit);
  return rows.map(mapApproval);
}

export async function countContestApprovalInbox(
  reviewer: Pick<SafeUser, "id" | "role">,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(contestProblemApprovals)
    .where(
      and(
        eq(contestProblemApprovals.status, "PENDING"),
        reviewer.role === "ADMIN"
          ? undefined
          : eq(contestProblemApprovals.authorId, reviewer.id),
      ),
    );
  return Number(row?.value ?? 0);
}

export async function decideContestProblemApproval(
  reviewer: Pick<SafeUser, "id" | "role" | "displayName">,
  approvalId: string,
  input: ContestApprovalDecisionInput,
): Promise<ContestProblemApprovalItem> {
  if (input.action === "reject" && !input.reviewNote?.trim()) {
    throw errors.validation("Explain why the problem cannot be used.");
  }

  const [preview] = await getDb()
    .select({
      contestId: contestProblemApprovals.contestId,
      problemId: contestProblemApprovals.problemId,
      authorId: contestProblemApprovals.authorId,
      status: contestProblemApprovals.status,
      contestTitle: contests.title,
      problemTitle: problems.title,
      createdBy: contests.createdBy,
      creatorRole: users.role,
    })
    .from(contestProblemApprovals)
    .innerJoin(contests, eq(contests.id, contestProblemApprovals.contestId))
    .innerJoin(problems, eq(problems.id, contestProblemApprovals.problemId))
    .leftJoin(users, eq(users.id, contests.createdBy))
    .where(eq(contestProblemApprovals.id, approvalId))
    .limit(1);
  if (!preview) throw errors.notFound("Approval request not found.");
  if (preview.status !== "PENDING") {
    throw errors.conflict("This approval request has already been decided.");
  }
  if (reviewer.role !== "ADMIN" && preview.authorId !== reviewer.id) {
    throw errors.forbidden(
      "Only the problem author or an admin can decide this request.",
    );
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ status: contestProblemApprovals.status })
      .from(contestProblemApprovals)
      .where(eq(contestProblemApprovals.id, approvalId))
      .for("update");
    if (!row) throw errors.notFound("Approval request not found.");
    if (row.status !== "PENDING") {
      throw errors.conflict("This approval request has already been decided.");
    }
    await tx
      .update(contestProblemApprovals)
      .set({
        status: input.action === "approve" ? "APPROVED" : "REJECTED",
        reviewedById: reviewer.id,
        reviewNote: input.reviewNote?.trim() || null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contestProblemApprovals.id, approvalId));
  });

  const rows = await approvalQuery().where(
    eq(contestProblemApprovals.id, approvalId),
  );
  const row = rows[0];
  if (!row) throw errors.notFound("Approval request not found.");
  const item = mapApproval(row);

  if (preview.createdBy) {
    const approved = input.action === "approve";
    await notifyUser({
      userId: preview.createdBy,
      type: "CONTEST_APPROVAL",
      title: `Contest problem ${approved ? "approved" : "declined"}`,
      body: `${reviewer.displayName} ${approved ? "approved" : "declined"} using "${preview.problemTitle}" in "${preview.contestTitle}".${item.reviewNote ? ` Note: ${item.reviewNote}` : ""}`,
      href:
        preview.creatorRole === "ADMIN"
          ? `/admin/contests/${preview.contestId}/edit`
          : `/teacher/contests/${preview.contestId}/edit`,
      dedupeKey: `contest-approval:${approvalId}:${input.action}`,
    });
    if (approved && (await countUnapprovedContestProblems(preview.contestId)) === 0) {
      await notifyUser({
        userId: preview.createdBy,
        type: "CONTEST_APPROVAL",
        title: "Contest ready to publish",
        body: `All problem approvals for "${preview.contestTitle}" are complete. You can make the contest public.`,
        href:
          preview.creatorRole === "ADMIN"
            ? `/admin/contests/${preview.contestId}/edit`
            : `/teacher/contests/${preview.contestId}/edit`,
        dedupeKey: `contest-approvals-ready:${preview.contestId}`,
      });
    }
  }
  return item;
}
