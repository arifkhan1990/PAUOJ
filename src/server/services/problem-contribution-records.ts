import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/server/db";
import { problemContributions, problems, users } from "@/server/db/schema";
import type {
  ProblemContributionItem,
  ProblemContributionKind,
  ProblemContributionPayload,
  ProblemContributionStatus,
} from "@/lib/contribution-types";

const contributorUser = alias(users, "contribution_contributor");
const reviewerUser = alias(users, "contribution_reviewer");

const contributionColumns = {
  id: problemContributions.id,
  problemId: problemContributions.problemId,
  problemSlug: problems.slug,
  problemTitle: problems.title,
  kind: problemContributions.kind,
  status: problemContributions.status,
  note: problemContributions.note,
  payload: problemContributions.payload,
  reviewNote: problemContributions.reviewNote,
  reviewedAt: problemContributions.reviewedAt,
  createdAt: problemContributions.createdAt,
  updatedAt: problemContributions.updatedAt,
  contributorUsername: contributorUser.username,
  contributorDisplayName: contributorUser.displayName,
  reviewerUsername: reviewerUser.username,
  reviewerDisplayName: reviewerUser.displayName,
};

export type ContributionRow = {
  id: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  kind: ProblemContributionKind;
  status: ProblemContributionStatus;
  note: string | null;
  payload: ProblemContributionPayload;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  contributorUsername: string | null;
  contributorDisplayName: string | null;
  reviewerUsername: string | null;
  reviewerDisplayName: string | null;
};

export function contributionQuery() {
  return getDb()
    .select(contributionColumns)
    .from(problemContributions)
    .innerJoin(problems, eq(problems.id, problemContributions.problemId))
    .innerJoin(
      contributorUser,
      eq(contributorUser.id, problemContributions.contributorId),
    )
    .leftJoin(
      reviewerUser,
      eq(reviewerUser.id, problemContributions.reviewedById),
    );
}

export function mapContribution(
  row: ContributionRow,
): ProblemContributionItem {
  return {
    id: row.id,
    problemId: row.problemId,
    problemSlug: row.problemSlug,
    problemTitle: row.problemTitle,
    kind: row.kind,
    status: row.status,
    note: row.note,
    payload: row.payload,
    contributor:
      row.contributorUsername && row.contributorDisplayName
        ? {
            username: row.contributorUsername,
            displayName: row.contributorDisplayName,
          }
        : null,
    reviewer:
      row.reviewerUsername && row.reviewerDisplayName
        ? {
            username: row.reviewerUsername,
            displayName: row.reviewerDisplayName,
          }
        : null,
    reviewNote: row.reviewNote,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function loadProblemRow(slug: string) {
  const [problem] = await getDb()
    .select({
      id: problems.id,
      title: problems.title,
      authorId: problems.authorId,
      isPublic: problems.isPublic,
      publicationStatus: problems.publicationStatus,
    })
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);
  return problem ?? null;
}
