import { Table2, UserRound } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";
import { SQL_PROJECT_METRICS } from "@/lib/learning/sql-project";
import { cn } from "@/lib/utils";
import { ProjectEmpty, TableChips } from "./project-shared";

export function ProjectMetrics({ className }: { className?: string }) {
  return (
    <section id="metrics" className={cn("scroll-mt-24", className)}>
      <SectionHeading
        title="Metric dictionary"
        description="One definition per business number, with the formula, source tables and the person who owns it."
      />

      {SQL_PROJECT_METRICS.length === 0 ? (
        <ProjectEmpty>
          Metric definitions are being reviewed with the Head of Data before
          they are published.
        </ProjectEmpty>
      ) : (
        <ul role="list" className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {SQL_PROJECT_METRICS.map((metric) => (
            <li key={metric.id} className="min-w-0">
              <Card className="flex h-full min-w-0 flex-col p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words text-sm font-semibold">
                    {metric.name}
                  </h3>
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {metric.id}
                  </span>
                </div>

                <p
                  lang="bn"
                  className="mt-2 break-words text-xs leading-relaxed text-muted-foreground"
                >
                  {metric.definition}
                </p>

                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Formula
                  </p>
                  <pre className="mt-1.5 rounded-lg border border-border bg-muted/30 p-2.5 font-mono text-[10.5px] leading-relaxed">
                    <code className="whitespace-pre-wrap break-words">
                      {metric.formula}
                    </code>
                  </pre>
                </div>

                {metric.tables.length > 0 ? (
                  <div className="mt-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <Table2 className="size-3" aria-hidden="true" />
                      Source tables
                    </p>
                    <TableChips tables={metric.tables} className="mt-1.5" />
                  </div>
                ) : null}

                <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-2.5 text-[11px] text-muted-foreground">
                  <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
                  Owner ·{" "}
                  <span className="font-medium text-foreground">
                    {metric.owner}
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
