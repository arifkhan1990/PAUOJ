import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  PencilLine,
} from "lucide-react";
import { PublicationStatusBadge } from "@/components/problems/publication-status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ProblemReviewActions } from "@/features/reviews/problem-review-actions";
import { ProblemReviewPreview } from "@/features/reviews/problem-review-preview";
import { ProblemReviewStatus } from "@/features/reviews/problem-review-status";
import {
  PUBLICATION_STATUS_LABELS,
  type ProblemReviewDetail,
} from "@/lib/problem-review-types";
import { formatDate, formatRelative } from "@/lib/utils";

export function ProblemReviewWorkspace({
  review,
  basePath,
  isAdmin = false,
}: {
  review: ProblemReviewDetail;
  basePath: string;
  isAdmin?: boolean;
}) {
  const contentEditable =
    review.publicationStatus === "DRAFT" ||
    review.publicationStatus === "CHANGES_REQUESTED";
  const editHref = !contentEditable
    ? null
    : basePath === "/admin"
      ? `/admin/problems/${review.problemId}/edit`
      : review.viewer.isAuthor && basePath !== "/dashboard"
        ? `${basePath}/problems/${review.problemId}/edit`
        : isAdmin
          ? `/admin/problems/${review.problemId}/edit`
          : null;
  const authorLabel = review.author?.displayName ?? "Unknown author";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Publication review"
        title={review.title}
        description={`By ${authorLabel} · Review cycle ${review.reviewCycle} · ${PUBLICATION_STATUS_LABELS[review.publicationStatus]}`}
        actions={
          <>
            {review.publicationStatus === "PUBLISHED" ? (
              <Link
                href={`/problems/${review.slug}`}
                className={buttonVariants({ variant: "outline" })}
              >
                <ExternalLink className="size-4" /> View problem
              </Link>
            ) : null}
            {editHref ? (
              <Link
                href={editHref}
                className={buttonVariants({ variant: "outline" })}
              >
                <PencilLine className="size-4" /> Edit problem
              </Link>
            ) : null}
            <Link
              href={`${basePath}/reviews`}
              className={buttonVariants({ variant: "ghost" })}
            >
              <ArrowLeft className="size-4" /> Back to reviews
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <PublicationStatusBadge status={review.publicationStatus} />
        {review.publishedAt ? (
          <span className="text-[11px] text-muted-foreground">
            Published {formatDate(review.publishedAt)}
          </span>
        ) : null}
        <span className="text-[11px] text-muted-foreground">
          Updated {formatRelative(review.updatedAt)}
        </span>
      </div>

      {review.publicationStatus === "CHANGES_REQUESTED" ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3.5 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-500/15">
            <AlertTriangle className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Changes requested — approvals are locked until every hold is
              resolved.
            </p>
            <p className="mt-0.5 text-xs leading-relaxed opacity-80">
              The author responds to each hold, then the setter who raised it
              (or an admin) resolves it. When no hold remains, the review
              reopens and approvals unlock.
            </p>
          </div>
        </div>
      ) : null}

      <ProblemReviewStatus review={review} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <ProblemReviewPreview review={review} />
        </div>
        <aside className="min-w-0">
          <ProblemReviewActions review={review} isAdmin={isAdmin} />
        </aside>
      </div>
    </div>
  );
}
