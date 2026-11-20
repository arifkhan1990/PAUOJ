import Link from "next/link";
import { ArrowLeft, ExternalLink, GitPullRequest } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import type { AdminProblemDetail } from "@/lib/types";

export function ProblemFormHeader({
  initial,
  basePath,
}: {
  initial: AdminProblemDetail | null;
  basePath: string;
}) {
  return (
    <PageHeader
      eyebrow="Problem setter"
      title={initial ? "Edit problem" : "New problem"}
      description="Statements use Markdown. Every problem needs at least one sample and one hidden test."
      actions={
        <>
          {initial ? (
            <Link
              href={`${basePath}/${initial.id}/contributions`}
              className={buttonVariants({ variant: "outline" })}
            >
              <GitPullRequest className="size-4" /> Review proposals
              {initial.pendingContributions > 0
                ? ` (${initial.pendingContributions})`
                : ""}
            </Link>
          ) : null}
          {initial ? (
            <Link
              href={`/problems/${initial.slug}`}
              className={buttonVariants({ variant: "outline" })}
            >
              <ExternalLink className="size-4" /> View
            </Link>
          ) : null}
          <Link href={basePath} className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft className="size-4" /> Back
          </Link>
        </>
      }
    />
  );
}
