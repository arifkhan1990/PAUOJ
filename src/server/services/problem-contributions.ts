import { and, count, desc, eq, isNull, ne, sql } from "drizzle-orm";
import { ApiError, errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import { problemContributions, problems, submissions, users } from "@/server/db/schema";
import type {
  ProblemContributionItem,
  ProblemContributionPayload,
} from "@/lib/contribution-types";
import { CONTRIBUTION_KIND_LABELS } from "@/lib/contribution-types";
import type {
  ContributionDecisionInput,
  ProblemContributionInput,
} from "@/lib/schemas/problem-contribution";
import type { SafeUser } from "@/server/auth/session";
import { notifyUser } from "./notifications";
import { assertProblemNotInLiveContext } from "./problem-access";
import { applyContribution } from "./problem-contribution-apply";
import {
  contributionQuery,
  mapContribution,
  loadProblemRow,
} from "./problem-contribution-records";
import { rejudgeProblemPracticeSubmissions } from "./problem-rejudge";

function normalizePayload(
  input: ProblemContributionInput,
): ProblemContributionPayload {
  if (input.kind === "STATEMENT") {
    return {
      statement: input.payload.statement,
      inputFormat: input.payload.inputFormat || null,
      outputFormat: input.payload.outputFormat || null,
      constraints: input.payload.constraints || null,
    };
  }
  if (input.kind === "TESTS") {
    return { tests: input.payload.tests };
  }
  return { editorial: input.payload.editorial };
}

const CONTRIBUTION_LIST_LIMIT = 100;

async function hasSolvedProblem(
  userId: string,
  problemId: string,
): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        eq(submissions.problemId, problemId),
        eq(submissions.status, "ACCEPTED"),
        isNull(submissions.assessmentId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function hasAcceptedSolution(
  userId: string,
  problemId: string,
): Promise<boolean> {
  return hasSolvedProblem(userId, problemId);
}

async function findContribution(id: string): Promise<ProblemContributionItem> {
  const rows = await contributionQuery().where(eq(problemContributions.id, id));
  const row = rows[0];
  if (!row) throw errors.notFound("Proposal not found.");
  return mapContribution(row);
}

export async function createProblemContribution(
  contributor: Pick<SafeUser, "id" | "role" | "displayName">,
  slug: string,
  input: ProblemContributionInput,
): Promise<ProblemContributionItem> {
  const problem = await loadProblemRow(slug);
  if (!problem) throw errors.notFound("Problem not found.");
  if (problem.authorId === contributor.id) {
    throw errors.validation(
      "You are the author of this problem; proposals must come from another setter.",
    );
  }
  if (!problem.isPublic && contributor.role !== "ADMIN") {
    throw errors.notFound("Problem not found.");
  }
  if (
    problem.publicationStatus === "IN_REVIEW" ||
    problem.publicationStatus === "CHANGES_REQUESTED"
  ) {
    throw errors.conflict(
      "This problem is locked for publication review. Ask a reviewer to put it on hold instead of submitting a proposal.",
    );
  }
  if (
    problem.publicationStatus === "PUBLISHED" &&
    input.kind !== "EDITORIAL"
  ) {
    throw errors.conflict(
      "Statement and test changes to a published problem need a new publication review.",
    );
  }
  if (contributor.role === "USER") {
    if (input.kind !== "EDITORIAL") {
      throw errors.validation(
        "Community contributors can only propose editorials.",
      );
    }
    if (!(await hasSolvedProblem(contributor.id, problem.id))) {
      throw errors.forbidden(
        "Solve this problem with an accepted submission before proposing an editorial.",
      );
    }
  }
  await assertProblemNotInLiveContext(
    problem.id,
    "CONTRIBUTIONS_LOCKED",
    "This problem is part of a running contest or assessment. Proposals reopen after it ends.",
  );

  const [existing] = await getDb()
    .select({ id: problemContributions.id })
    .from(problemContributions)
    .where(
      and(
        eq(problemContributions.problemId, problem.id),
        eq(problemContributions.contributorId, contributor.id),
        eq(problemContributions.kind, input.kind),
        eq(problemContributions.status, "PENDING"),
      ),
    )
    .limit(1);
  if (existing) {
    throw errors.conflict(
      `You already have a pending ${CONTRIBUTION_KIND_LABELS[input.kind].toLowerCase()} proposal on this problem. Withdraw it before sending another.`,
    );
  }

  const [created] = await getDb()
    .insert(problemContributions)
    .values({
      problemId: problem.id,
      contributorId: contributor.id,
      kind: input.kind,
      payload: normalizePayload(input),
      note: input.note?.trim() || null,
      status: "PENDING",
    })
    .returning({ id: problemContributions.id });
  if (!created) {
    throw new ApiError(
      "CREATE_FAILED",
      "Could not save the proposal.",
      500,
    );
  }

  if (problem.authorId) {
    const [authorRow] = await getDb()
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, problem.authorId))
      .limit(1);
    await notifyUser({
      userId: problem.authorId,
      type: "CONTRIBUTION",
      title: `New ${CONTRIBUTION_KIND_LABELS[input.kind].toLowerCase()} proposal`,
      body: `${contributor.displayName} proposed a change for "${problem.title}". Review it before it goes live.`,
      href:
        authorRow?.role === "ADMIN"
          ? "/admin/contributions"
          : authorRow?.role === "TEACHER"
            ? "/teacher/contributions"
            : "/dashboard/contributions",
    });
  }

  return findContribution(created.id);
}

export async function listProblemContributions(
  problemId: string,
  reviewer: Pick<SafeUser, "id" | "role">,
): Promise<ProblemContributionItem[]> {
  const [problem] = await getDb()
    .select({ authorId: problems.authorId })
    .from(problems)
    .where(eq(problems.id, problemId))
    .limit(1);
  if (!problem) throw errors.notFound("Problem not found.");
  if (reviewer.role !== "ADMIN" && problem.authorId !== reviewer.id) {
    throw errors.forbidden(
      "Only the problem author or an admin can review its proposals.",
    );
  }

  const rows = await contributionQuery()
    .where(eq(problemContributions.problemId, problemId))
    .orderBy(
      sql`case when ${problemContributions.status} = 'PENDING' then 0 else 1 end`,
      desc(problemContributions.createdAt),
    )
    .limit(CONTRIBUTION_LIST_LIMIT);
  return rows.map(mapContribution);
}

export async function listMyContributions(
  contributorId: string,
  limit = 50,
): Promise<ProblemContributionItem[]> {
  const rows = await contributionQuery()
    .where(eq(problemContributions.contributorId, contributorId))
    .orderBy(desc(problemContributions.createdAt))
    .limit(limit);
  return rows.map(mapContribution);
}

function reviewInboxWhere(reviewer: Pick<SafeUser, "id" | "role">) {
  return and(
    eq(problemContributions.status, "PENDING"),
    ne(problemContributions.contributorId, reviewer.id),
    reviewer.role === "ADMIN"
      ? undefined
      : eq(problems.authorId, reviewer.id),
  );
}

export async function listReviewInbox(
  reviewer: Pick<SafeUser, "id" | "role">,
  limit = 50,
): Promise<ProblemContributionItem[]> {
  const rows = await contributionQuery()
    .where(reviewInboxWhere(reviewer))
    .orderBy(desc(problemContributions.createdAt))
    .limit(limit);
  return rows.map(mapContribution);
}

export async function countReviewInbox(
  reviewer: Pick<SafeUser, "id" | "role">,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(problemContributions)
    .innerJoin(problems, eq(problems.id, problemContributions.problemId))
    .where(reviewInboxWhere(reviewer));
  return Number(row?.value ?? 0);
}

export async function countPendingContributions(
  problemId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: sql<number>`count(*)::int` })
    .from(problemContributions)
    .where(
      and(
        eq(problemContributions.problemId, problemId),
        eq(problemContributions.status, "PENDING"),
      ),
    );
  return Number(row?.value ?? 0);
}

export async function countProblemContributions(
  problemId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(problemContributions)
    .where(eq(problemContributions.problemId, problemId));
  return Number(row?.value ?? 0);
}

export type ContributionDecisionResult = {
  item: ProblemContributionItem;
  rejudged: number;
  rejudgeFailed: boolean;
};

export async function decideProblemContribution(
  reviewer: Pick<SafeUser, "id" | "role" | "displayName">,
  contributionId: string,
  input: ContributionDecisionInput,
): Promise<ContributionDecisionResult> {
  const [preview] = await getDb()
    .select({
      problemId: problemContributions.problemId,
      contributorId: problemContributions.contributorId,
      status: problemContributions.status,
    })
    .from(problemContributions)
    .where(eq(problemContributions.id, contributionId))
    .limit(1);
  if (!preview) throw errors.notFound("Proposal not found.");
  if (preview.status !== "PENDING") {
    throw errors.conflict("This proposal has already been reviewed.");
  }

  if (input.action === "approve") {
    await assertProblemNotInLiveContext(
      preview.problemId,
      "CONTRIBUTIONS_LOCKED",
      "This problem is part of a running contest or assessment. Proposals can be approved after it ends.",
    );
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    const [contribution] = await tx
      .select()
      .from(problemContributions)
      .where(eq(problemContributions.id, contributionId))
      .for("update");
    if (!contribution) throw errors.notFound("Proposal not found.");
    if (contribution.status !== "PENDING") {
      throw errors.conflict("This proposal has already been reviewed.");
    }

    const [problem] = await tx
      .select({
        id: problems.id,
        title: problems.title,
        authorId: problems.authorId,
        publicationStatus: problems.publicationStatus,
      })
      .from(problems)
      .where(eq(problems.id, contribution.problemId))
      .for("update");
    if (!problem) throw errors.notFound("Problem not found.");

    if (input.action === "withdraw") {
      if (contribution.contributorId !== reviewer.id) {
        throw errors.forbidden("You can only withdraw your own proposal.");
      }
      await tx
        .update(problemContributions)
        .set({ status: "WITHDRAWN", updatedAt: new Date() })
        .where(eq(problemContributions.id, contributionId));
      return;
    }

    if (reviewer.role !== "ADMIN" && problem.authorId !== reviewer.id) {
      throw errors.forbidden(
        "Only the problem author or an admin can review its proposals.",
      );
    }
    if (contribution.contributorId === reviewer.id) {
      throw errors.forbidden(
        "You cannot review your own proposal. Ask another reviewer.",
      );
    }

    if (input.action === "approve") {
      if (
        problem.publicationStatus === "IN_REVIEW" ||
        problem.publicationStatus === "CHANGES_REQUESTED"
      ) {
        throw errors.conflict(
          "This problem is locked for publication review. Use a review hold instead of approving a proposal.",
        );
      }
      if (
        problem.publicationStatus === "PUBLISHED" &&
        contribution.kind !== "EDITORIAL"
      ) {
        throw errors.conflict(
          "Statement and test changes to a published problem need a new publication review.",
        );
      }
      await applyContribution(tx, contribution, problem.id);
    }

    await tx
      .update(problemContributions)
      .set({
        status: input.action === "approve" ? "APPROVED" : "REJECTED",
        reviewedById: reviewer.id,
        reviewNote: input.reviewNote?.trim() || null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(problemContributions.id, contributionId));
  });

  const item = await findContribution(contributionId);
  if (input.action !== "withdraw") {
    const [contributorRow] = await getDb()
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, preview.contributorId))
      .limit(1);
    const approved = input.action === "approve";
    await notifyUser({
      userId: preview.contributorId,
      type: "CONTRIBUTION",
      title: `Proposal ${approved ? "approved" : "rejected"}`,
      body: `${reviewer.displayName} ${approved ? "approved" : "rejected"} your ${CONTRIBUTION_KIND_LABELS[item.kind].toLowerCase()} proposal for "${item.problemTitle}".${item.reviewNote ? ` Note: ${item.reviewNote}` : ""}`,
      href:
        contributorRow?.role === "ADMIN"
          ? "/admin/contributions"
          : contributorRow?.role === "TEACHER"
            ? "/teacher/contributions"
            : "/dashboard/contributions",
    });
  }
  let rejudged = 0;
  let rejudgeFailed = false;
  if (
    input.action === "approve" &&
    item.kind === "TESTS" &&
    input.rejudge
  ) {
    const result = await rejudgeProblemPracticeSubmissions(
      reviewer.id,
      item.problemId,
    );
    rejudged = result.queued;
    rejudgeFailed = result.failed;
  }
  return { item, rejudged, rejudgeFailed };
}
