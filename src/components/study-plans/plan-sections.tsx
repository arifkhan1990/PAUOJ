import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ProblemNote } from "@/components/study-plans/problem-note";
import { PlanProgressRing } from "@/components/study-plans/plan-progress-ring";
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

function sectionLabel(section: StudyListSectionView): string {
  return `${section.title}: ${section.solvedCount} of ${section.problemCount} problems solved`;
}

function sectionIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** Horizontal jump chips shown below the hero on phones and tablets. */
export function PlanSectionChips({
  sections,
  className,
}: {
  sections: StudyListSectionView[];
  className?: string;
}) {
  if (sections.length < 2) return null;

  return (
    <nav aria-label="Sections" className={cn("lg:hidden", className)}>
      <div className="reference-nav-scroll -mx-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        <ul className="flex w-max gap-2">
          {sections.map((section, index) => {
            const complete =
              section.problemCount > 0 &&
              section.solvedCount >= section.problemCount;

            return (
              <li key={section.id ?? "general"}>
                <a
                  href={`#${sectionAnchorId(section.id)}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="font-mono text-[10.5px] tabular-nums text-foreground/60">
                    {sectionIndex(index)}
                  </span>
                  <span className="max-w-48 truncate text-foreground/90">
                    {section.title}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10.5px] tabular-nums">
                    {complete ? (
                      <CheckCircle2
                        className="size-3.5 text-emerald-600 dark:text-emerald-400"
                        aria-hidden="true"
                      />
                    ) : null}
                    {section.solvedCount}/{section.problemCount}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

/** Sticky section index in the desktop aside. */
export function PlanSectionRail({
  sections,
  className,
}: {
  sections: StudyListSectionView[];
  className?: string;
}) {
  if (sections.length < 2) return null;

  return (
    <nav
      aria-label="Sections"
      className={cn(
        "hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain",
        className,
      )}
    >
      <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Sections
      </p>
      <ul className="mt-2 space-y-0.5">
        {sections.map((section, index) => {
          const percent = studyProgressPercent(
            section.solvedCount,
            section.problemCount,
          );

          return (
            <li key={section.id ?? "general"}>
              <a
                href={`#${sectionAnchorId(section.id)}`}
                className="group flex min-h-11 items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <PlanProgressRing
                  size="sm"
                  percent={percent}
                  solved={section.solvedCount}
                  total={section.problemCount}
                  label={sectionLabel(section)}
                />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">
                    <span className="mr-1.5 font-mono text-[10.5px] font-normal tabular-nums text-muted-foreground">
                      {sectionIndex(index)}
                    </span>
                    {section.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {section.solvedCount} of {section.problemCount} solved
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ProblemRow({
  problem,
  planSlug,
  signedIn,
}: {
  problem: StudyListProblem;
  planSlug: string;
  signedIn: boolean;
}) {
  const status = problemStatus(problem);

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-stretch transition-colors hover:bg-muted/30">
      <Link
        href={`/problems/${problem.slug}`}
        className="group flex min-h-14 min-w-0 items-center gap-3 py-2.5 pl-4 pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:pl-5"
      >
        <span className="w-5 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
          {problem.position}
        </span>
        <SolveStatus
          solved={problem.solved}
          attempted={problem.attempted}
          className="shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 break-words text-sm font-medium leading-snug group-hover:text-primary">
              {problem.title}
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
              {problem.points} pts
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            <span className={cn("text-[11px] font-medium", status.className)}>
              {status.label}
            </span>
          </span>
        </span>
      </Link>
      {signedIn ? (
        <ProblemNote
          planSlug={planSlug}
          problemSlug={problem.slug}
          problemTitle={problem.title}
          note={problem.note}
        />
      ) : null}
    </li>
  );
}

export function PlanSectionCard({
  section,
  index,
  signedIn,
  planSlug,
}: {
  section: StudyListSectionView;
  index: number;
  /** Shows the private note control on every problem for signed-in users. */
  signedIn: boolean;
  planSlug: string;
}) {
  const anchor = sectionAnchorId(section.id);
  const titleId = `${anchor}-title`;
  const percent = studyProgressPercent(
    section.solvedCount,
    section.problemCount,
  );

  return (
    <section id={anchor} aria-labelledby={titleId} className="scroll-mt-24">
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="text-base font-semibold leading-snug"
              >
                <span
                  aria-hidden="true"
                  className="mr-2 font-mono text-xs font-normal tabular-nums text-muted-foreground"
                >
                  {sectionIndex(index)}
                </span>
                <span className="break-words">{section.title}</span>
              </h2>
              {section.description ? (
                <p className="mt-1 break-words text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {section.description}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 sm:w-auto sm:shrink-0 sm:justify-end sm:gap-2.5">
              <PlanProgressRing
                className="order-2 sm:order-1"
                size="sm"
                percent={percent}
                solved={section.solvedCount}
                total={section.problemCount}
                label={sectionLabel(section)}
              />
              <p className="order-1 text-xs font-medium tabular-nums text-foreground/90 sm:order-2">
                {section.solvedCount} of {section.problemCount} solved
              </p>
            </div>
          </div>
        </div>

        {section.problems.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted-foreground sm:px-5">
            No problems in this section yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {section.problems.map((problem) => (
              <ProblemRow
                key={problem.slug}
                problem={problem}
                planSlug={planSlug}
                signedIn={signedIn}
              />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
