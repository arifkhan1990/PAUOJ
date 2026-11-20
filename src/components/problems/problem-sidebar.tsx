import Link from "next/link";
import {
  Clock3,
  HardDrive,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";
import { ProblemRatingCard } from "@/features/problems/problem-rating-card";
import { RelatedProblems } from "@/components/problems/related-problems";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProblemDetail, RelatedProblemItem } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

export function ProblemSidebar({
  problem,
  relatedProblems,
  showInsights,
  canRate,
  acceptance,
}: {
  problem: ProblemDetail;
  relatedProblems: RelatedProblemItem[];
  showInsights: boolean;
  canRate: boolean;
  acceptance: number;
}) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <Card className="p-5">
        <h2 className="text-sm font-semibold">Your progress</h2>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-muted">
            <Target className="size-5 text-primary" />
          </span>
          <div>
            <p className="text-sm font-medium">
              {problem.solvedByMe
                ? "Accepted"
                : problem.attemptedByMe
                  ? "In progress"
                  : "Not started"}
            </p>
            <p className="text-xs text-muted-foreground">
              {problem.acceptedCount} accepted of {problem.submissionCount}{" "}
              submissions
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, acceptance)}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
          <span>Acceptance</span>
          <span className="font-mono">{formatPercent(acceptance)}</span>
        </div>
        <div className="mt-5 grid gap-2">
          <a href="#submit" className={buttonVariants()}>
            {problem.solvedByMe ? "Solve again" : "Solve this problem"}
          </a>
          <Link
            href={`/submissions?problem=${problem.slug}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <ListChecks className="size-4" /> All submissions
          </Link>
        </div>
      </Card>

      {showInsights ? (
        <ProblemRatingCard
          slug={problem.slug}
          initial={problem.rating}
          canRate={canRate}
        />
      ) : null}

      {showInsights ? <RelatedProblems problems={relatedProblems} /> : null}

      {problem.author ? (
        <Card className="p-5">
          <h2 className="text-sm font-semibold">Problem setter</h2>
          <Link
            href={`/users/${problem.author.username}`}
            className="mt-3 flex items-center gap-3 hover:text-primary"
          >
            <UserAvatar
              name={problem.author.displayName}
              username={problem.author.username}
              size="sm"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {problem.author.displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                @{problem.author.username}
              </span>
            </span>
          </Link>
        </Card>
      ) : null}

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Limits</h2>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Clock3 className="size-4" /> Time
            </dt>
            <dd className="font-mono text-xs">{problem.timeLimitMs} ms</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <HardDrive className="size-4" /> Memory
            </dt>
            <dd className="font-mono text-xs">{problem.memoryLimitMb} MB</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="size-4" /> Points
            </dt>
            <dd className="font-mono text-xs">{problem.points}</dd>
          </div>
        </dl>
      </Card>
    </aside>
  );
}
