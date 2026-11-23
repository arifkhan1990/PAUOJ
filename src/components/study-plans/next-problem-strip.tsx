import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { StudyListNextProblem } from "@/lib/study-list-types";
import { cn } from "@/lib/utils";

export function NextProblemStrip({
  nextProblem,
  completed,
  problemCount,
  className,
}: {
  nextProblem: StudyListNextProblem | null;
  completed: boolean;
  problemCount: number;
  className?: string;
}) {
  if (completed) {
    return (
      <Card
        className={cn(
          "border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            aria-hidden="true"
          >
            <CheckCircle2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Plan completed</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              You solved all {problemCount} problems in this plan. Revisit a
              section below whenever you want to refresh an idea.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!nextProblem) return null;

  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Next up
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Link
              href={`/problems/${nextProblem.slug}`}
              className="break-words text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {nextProblem.title}
            </Link>
            <DifficultyBadge difficulty={nextProblem.difficulty} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Problem {nextProblem.position}
            {nextProblem.sectionTitle ? ` · ${nextProblem.sectionTitle}` : ""}
          </p>
        </div>
        <Link
          href={`/problems/${nextProblem.slug}`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full shrink-0 sm:w-auto",
          )}
        >
          Solve problem
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
