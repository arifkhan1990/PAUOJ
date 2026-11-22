import { Card } from "@/components/ui/card";
import type { LearningProblemView } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { ProblemRow } from "./problem-row";

const TONE_DOT: Record<"easy" | "medium" | "hard", string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-rose-500",
};

export function ProblemGroup({
  title,
  titleLang,
  problems,
  emptyText,
  description,
  tone,
}: {
  title: string;
  titleLang?: string;
  problems: LearningProblemView[];
  emptyText: string;
  description?: string;
  tone?: "easy" | "medium" | "hard";
}) {
  const solved = problems.filter((problem) => problem.solved).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h3
          lang={titleLang}
          className="flex items-center gap-2 text-sm font-semibold"
        >
          {tone ? (
            <span
              aria-hidden="true"
              className={cn("size-2 shrink-0 rounded-full", TONE_DOT[tone])}
            />
          ) : null}
          {title}
        </h3>
        <span className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
          {solved > 0 ? (
            <span className="font-sans font-medium text-emerald-700 dark:text-emerald-400">
              {solved} solved
            </span>
          ) : null}
          <span className="rounded-full border border-border px-2 py-0.5 tabular-nums">
            {problems.length} {problems.length === 1 ? "problem" : "problems"}
          </span>
        </span>
      </div>

      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}

      {problems.length === 0 ? (
        <p className="mt-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <Card className="mt-2 overflow-hidden">
          <ul className="divide-y divide-border">
            {problems.map((problem, index) => (
              <li key={problem.slug}>
                <ProblemRow problem={problem} position={index + 1} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
