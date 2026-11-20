import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, GitPullRequest } from "lucide-react";
import { ContributionList } from "@/features/contributions/contribution-list";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import type { SafeUser } from "@/server/auth/session";
import { getAdminProblemDetail } from "@/server/services/admin-problems";
import {
  countPendingContributions,
  countProblemContributions,
  listProblemContributions,
} from "@/server/services/problem-contributions";

export async function ProblemContributionsView({
  problemId,
  viewer,
  editHref,
  backHref = "/teacher/contributions",
  backLabel = "Back to contributions",
}: {
  problemId: string;
  viewer: SafeUser;
  editHref: string | null;
  backHref?: string;
  backLabel?: string;
}) {
  const problem = await getAdminProblemDetail(
    problemId,
    viewer.role === "ADMIN" ? undefined : viewer.id,
  );
  if (!problem) notFound();

  const [items, pending, total] = await Promise.all([
    listProblemContributions(problemId, viewer),
    countPendingContributions(problemId),
    countProblemContributions(problemId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Review queue"
        title={problem.title}
        description={`${pending} pending · ${total} total proposal${total === 1 ? "" : "s"}${total > items.length ? ` · showing the latest ${items.length}` : ""}. Approving a proposal publishes it immediately.`}
        actions={
          <>
            <Link
              href={`/problems/${problem.slug}`}
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLink className="size-4" /> View problem
            </Link>
            {editHref ? (
              <Link
                href={editHref}
                className={buttonVariants({ variant: "outline" })}
              >
                <GitPullRequest className="size-4" /> Open editor
              </Link>
            ) : null}
            <Link
              href={backHref}
              className={buttonVariants({ variant: "ghost" })}
            >
              <ArrowLeft className="size-4" /> {backLabel}
            </Link>
          </>
        }
      />

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <GitPullRequest className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Test proposals are appended to the existing suite; they never replace
          or reveal hidden tests. Statement and editorial proposals replace the
          live version when approved. Proposals are blocked while the problem is
          inside a running contest or assessment.
        </p>
      </div>

      <ContributionList
        items={items}
        viewerUsername={viewer.username}
        canReview
        current={{
          statement: problem.statement,
          inputFormat: problem.inputFormat,
          outputFormat: problem.outputFormat,
          constraints: problem.constraints,
          editorial: problem.editorial,
        }}
        emptyTitle="No proposals for this problem"
        emptyDescription="Teachers and admins can open the problem and choose Contribute to send a statement, test or editorial proposal."
      />
    </div>
  );
}
