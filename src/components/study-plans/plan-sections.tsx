import Link from "next/link";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { SolveStatus } from "@/components/shared/solve-status";
import { Card } from "@/components/ui/card";
import { studyProgressPercent } from "@/lib/study-list";
import type {
  StudyListProblem,
  StudyListSectionView,
} from "@/lib/study-list-types";
import { cn } from "@/lib/utils";

export function sectionAnchorId(id: string | null): string {
  return `section-${id ?? "general"}`;
}

function problemStatus(problem: StudyListProblem) {
  if (problem.solved) {
    return {
      label: "Solved",
      className: "text-emerald-700 dark:text-emerald-300",
    };
  }
  if (problem.attempted) {
    return {
      label: "Attempted",
      className: "text-amber-700 dark:text-amber-300",
    };
  }
  return { label: "Not started", className: "text-muted-foreground" };
}

export function PlanSectionNav({
  sections,
  className,
}: {
  sections: StudyListSectionView[];
  className?: string;
}) {
  if (sections.length < 2) return null;

  return (
    <nav aria-label="Jump to a section" className={cn(className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Jump to
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {sections.map((section, index) => (
          <li key={section.id ?? "general"}>
            <a
              href={`#${sectionAnchorId(section.id)}`}
              className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="font-mono text-[10.5px] tabular-nums text-foreground/60">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 truncate">{section.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ProblemRow({ problem }: { problem: StudyListProblem }) {
  const status = problemStatus(problem);

  return (
    <li>
      <Link
        href={`/problems/${problem.slug}`}
        className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
      >
        <span className="w-6 shrink-0 pt-0.5 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
          {problem.position}
        </span>
        <SolveStatus
          solved={problem.solved}
          attempted={problem.attempted}
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="min-w-0 break-words text-sm font-medium group-hover:text-primary">
              {problem.title}
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
              {problem.points} pts
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            <span className={cn("text-[11px] font-medium", status.className)}>
              {status.label}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export function PlanSectionCard({
  section,
  index,
}: {
  section: StudyListSectionView;
  index: number;
}) {
  const anchor = sectionAnchorId(section.id);
  const titleId = `${anchor}-title`;
  const percent = studyProgressPercent(
    section.solvedCount,
    section.problemCount,
  );

  return (
    <section
      id={anchor}
      aria-labelledby={titleId}
      className="scroll-mt-24"
    >
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="flex items-baseline gap-2 break-words text-base font-semibold"
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 font-mono text-xs font-normal tabular-nums text-muted-foreground"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              {section.description ? (
                <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">
                  {section.description}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              <span className="font-mono font-medium tabular-nums text-foreground/80">
                {section.solvedCount}/{section.problemCount}
              </span>{" "}
              solved
            </p>
          </div>
          <div
            role="progressbar"
            aria-label={`${section.title}: ${section.solvedCount} of ${section.problemCount} problems solved`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${section.solvedCount} of ${section.problemCount} problems solved`}
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/60"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {section.problems.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted-foreground sm:px-5">
            No problems in this section yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {section.problems.map((problem) => (
              <ProblemRow key={problem.slug} problem={problem} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
