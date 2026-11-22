import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { SolveStatus } from "@/components/shared/solve-status";
import type { LearningProblemView } from "@/lib/learning/types";

export function ProblemRow({
  problem,
  position,
}: {
  problem: LearningProblemView;
  position?: number;
}) {
  const state = problem.solved
    ? "Solved"
    : problem.attempted
      ? "Attempted"
      : "Not attempted";

  return (
    <Link
      href={`/problems/${problem.slug}`}
      className="group/row grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4 sm:py-3.5"
    >
      <span className="mt-0.5 flex items-center gap-2">
        {typeof position === "number" ? (
          <span
            className="w-5 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground"
            aria-hidden="true"
          >
            {position}
          </span>
        ) : null}
        <span aria-hidden="true">
          <SolveStatus solved={problem.solved} attempted={problem.attempted} />
        </span>
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-medium leading-snug transition-colors group-hover/row:text-primary">
          {problem.title}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="font-mono text-[11px] text-muted-foreground">
            {problem.points} pts
          </span>
          {problem.solved ? (
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              Solved
            </span>
          ) : problem.attempted ? (
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
              Attempted
            </span>
          ) : (
            <span className="sr-only">{state}</span>
          )}
        </span>
      </span>

      <ArrowUpRight
        className="mt-1 size-3.5 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover/row:-translate-y-0.5 group-hover/row:translate-x-0.5 group-hover/row:text-primary motion-reduce:transition-none"
        aria-hidden="true"
      />
    </Link>
  );
}
