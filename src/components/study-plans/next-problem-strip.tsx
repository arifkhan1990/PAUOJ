import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { buttonVariants } from "@/components/ui/button";
import type { StudyListNextProblem } from "@/lib/study-list-types";
import { cn } from "@/lib/utils";

export function NextProblemStrip({
  nextProblem,
  className,
}: {
  nextProblem: StudyListNextProblem | null;
  className?: string;
}) {
  if (!nextProblem) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
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
          buttonVariants({ size: "default" }),
          "w-full shrink-0 sm:w-auto",
        )}
      >
        Solve problem
        <ArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}
