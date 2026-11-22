import { Card } from "@/components/ui/card";
import type { LearningProblemView } from "@/lib/learning/types";
import { ProblemRow } from "./problem-row";

export function ProblemGroup({
  title,
  problems,
  emptyText,
  description,
}: {
  title: string;
  problems: LearningProblemView[];
  emptyText: string;
  description?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {problems.length} {problems.length === 1 ? "problem" : "problems"}
        </span>
      </div>
      {description ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      ) : null}
      {problems.length === 0 ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{emptyText}</p>
      ) : (
        <Card className="mt-2 overflow-hidden">
          <ul className="divide-y divide-border">
            {problems.map((problem) => (
              <li key={problem.slug}>
                <ProblemRow problem={problem} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
