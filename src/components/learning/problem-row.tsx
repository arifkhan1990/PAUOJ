import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { SolveStatus } from "@/components/shared/solve-status";
import type { LearningProblemView } from "@/lib/learning/types";

export function ProblemRow({ problem }: { problem: LearningProblemView }) {
  return (
    <Link
      href={`/problems/${problem.slug}`}
      className="group/row flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <SolveStatus
        solved={problem.solved}
        attempted={problem.attempted}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{problem.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="font-mono text-[11px] text-muted-foreground">
            {problem.points} pts
          </span>
        </div>
      </div>
      <ArrowUpRight
        className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover/row:text-primary"
        aria-hidden="true"
      />
    </Link>
  );
}
