import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { ProblemTags } from "@/components/problems/problem-tags";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { SolveStatus } from "@/components/shared/solve-status";
import { buttonVariants } from "@/components/ui/button";
import { DIFFICULTIES, DIFFICULTY_META } from "@/lib/difficulty";
import type { ProblemListItem } from "@/lib/types";
import { cn, formatPercent } from "@/lib/utils";

function acceptanceOf(problem: ProblemListItem): number {
  if (problem.submissionCount === 0) return 0;
  return (problem.acceptedCount / problem.submissionCount) * 100;
}

function ProblemCard({ problem }: { problem: ProblemListItem }) {
  const acceptance = acceptanceOf(problem);
  const status = problem.solvedByMe
    ? "Solved by you"
    : problem.attemptedByMe
      ? "You have attempted this"
      : "Not started yet";

  return (
    <article className="reveal group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <Link
        href={`/problems/${problem.slug}`}
        aria-label={`Open ${problem.title}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
      <span
        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary via-primary/60 to-transparent transition-transform duration-300 group-hover:scale-x-100"
        aria-hidden
      />
      <div className="pointer-events-none relative z-10 flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SolveStatus
              solved={problem.solvedByMe}
              attempted={problem.attemptedByMe}
            />
            <DifficultyBadge difficulty={problem.difficulty} />
          </div>
          <span className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[11px] font-medium">
            {problem.points} pts
          </span>
        </div>

        <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
          {problem.title}
        </h3>
        <ProblemTags
          tags={problem.tags}
          className="pointer-events-auto mt-2.5"
        />

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Acceptance</span>
            <span className="font-mono tabular-nums">
              {formatPercent(acceptance, 0)}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/80 transition-[width] duration-500"
              style={{ width: `${Math.max(3, Math.min(100, acceptance))}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="truncate">{status}</span>
            <span className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground/70 transition-colors group-hover:text-primary">
              Open
              <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProblemShowcase({
  items,
  total,
  canCreate,
}: {
  items: ProblemListItem[];
  total: number;
  canCreate: boolean;
}) {
  return (
    <section id="problems" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Problem set"
        title="Practice that meets you where you are"
        description="Warm up with easy problems, then work through graphs, dynamic programming and harder data structures."
        href="/problems"
        linkLabel="View problem set"
        size="lg"
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Jump to
        </span>
        {DIFFICULTIES.map((difficulty) => (
          <Link
            key={difficulty}
            href={`/problems?difficulty=${difficulty}`}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-medium transition hover:-translate-y-0.5 hover:shadow-sm",
              DIFFICULTY_META[difficulty].className,
            )}
          >
            {DIFFICULTY_META[difficulty].label}
          </Link>
        ))}
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
          {total} ready to solve
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No problems published yet"
          description="An administrator can add the first problem from the admin dashboard."
          icon={Sparkles}
          action={
            canCreate ? (
              <Link href="/admin/problems/new" className={buttonVariants()}>
                Create a problem
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
          {total > items.length ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-card/40 px-5 py-4">
              <div>
                <p className="text-sm font-medium">
                  Looking for a specific topic?
                </p>
                <p className="text-xs text-muted-foreground">
                  Filter the full set by difficulty or tag.
                </p>
              </div>
              <Link
                href="/problems"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Browse all {total}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
