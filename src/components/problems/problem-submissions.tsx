import Link from "next/link";
import { ArrowUpRight, Code2, ListChecks } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import { SubmissionTable } from "@/components/submissions/submission-table";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SubmissionListItem } from "@/lib/types";
import type { SearchParams } from "@/lib/pagination";

export function ProblemSubmissions({
  slug,
  items,
  total,
  page,
  totalPages,
  searchParams,
}: {
  slug: string;
  items: SubmissionListItem[];
  total: number;
  page: number;
  totalPages: number;
  searchParams: SearchParams;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <ListChecks className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Submissions</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {total.toLocaleString("en-US")} judged{" "}
              {total === 1 ? "attempt" : "attempts"} on this problem.
            </p>
          </div>
        </div>
        <Link
          href={`/submissions?problem=${slug}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Open submissions page <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Be the first to submit a solution for this problem."
          icon={Code2}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              All attempts
            </p>
            {totalPages > 1 ? (
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
            ) : null}
          </div>
          <SubmissionTable items={items} showProblem={false} />
        </Card>
      )}

      <Pagination
        pathname={`/problems/${slug}`}
        searchParams={searchParams}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
