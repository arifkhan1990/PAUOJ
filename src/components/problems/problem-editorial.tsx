import Link from "next/link";
import { BookOpen, LockKeyhole } from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ProblemSectionCard } from "@/components/problems/problem-section-card";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProblemDetail } from "@/lib/types";

export function ProblemEditorial({ problem }: { problem: ProblemDetail }) {
  if (problem.editorialLocked) {
    return (
      <Card className="overflow-hidden">
        <div className="flex items-start gap-3 border-b border-border bg-muted/20 px-5 py-3.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <LockKeyhole className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Editorial</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Unlock the explanation by solving this problem.
            </p>
            {problem.editorialCredit ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Community editorial by{" "}
                <Link
                  href={`/users/${problem.editorialCredit.username}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {problem.editorialCredit.displayName}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <LockKeyhole className="size-6" />
          </span>
          <h3 className="mt-4 text-base font-semibold">
            Solve this problem to unlock the editorial
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Get an accepted submission and the full approach, complexity notes
            and reference code will appear here.
          </p>
          <a href="#submit" className={buttonVariants({ className: "mt-5" })}>
            Try the problem
          </a>
        </div>
      </Card>
    );
  }

  if (!problem.editorial) {
    return (
      <ProblemSectionCard
        title="Editorial"
        description="A written approach will be published here."
        icon={BookOpen}
      >
        <p className="text-sm text-muted-foreground">
          No editorial has been published for this problem yet.
        </p>
      </ProblemSectionCard>
    );
  }

  return (
    <ProblemSectionCard
      title="Editorial"
      description="Approach, complexity and reference implementation."
      icon={BookOpen}
      bodyClassName="px-5 py-5 sm:px-6"
    >
      {problem.editorialCredit ? (
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-border bg-muted/20 px-3 py-2">
          <UserAvatar
            name={problem.editorialCredit.displayName}
            username={problem.editorialCredit.username}
            size="sm"
          />
          <p className="text-xs text-muted-foreground">
            Community editorial by{" "}
            <Link
              href={`/users/${problem.editorialCredit.username}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {problem.editorialCredit.displayName}
            </Link>
          </p>
        </div>
      ) : null}
      <Markdown className="max-w-3xl">{problem.editorial}</Markdown>
    </ProblemSectionCard>
  );
}
