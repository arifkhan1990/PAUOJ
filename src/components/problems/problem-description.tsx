import {
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  FlaskConical,
  ShieldAlert,
} from "lucide-react";
import { Markdown } from "@/components/shared/markdown";
import { ProblemSectionCard } from "@/components/problems/problem-section-card";
import { SampleCard } from "@/components/problems/sample-card";
import type { ProblemDetail } from "@/lib/types";

export function ProblemDescription({ problem }: { problem: ProblemDetail }) {
  const hasIo = Boolean(problem.inputFormat || problem.outputFormat);
  const isSql = problem.judgeLanguage === "sql";

  return (
    <div className="space-y-5">
      <ProblemSectionCard
        title="Problem statement"
        icon={FileText}
        bodyClassName="px-5 py-5 sm:px-6"
      >
        <Markdown className="max-w-3xl">{problem.statement}</Markdown>
      </ProblemSectionCard>

      {hasIo ? (
        <div className="grid gap-5 md:grid-cols-2">
          {problem.inputFormat ? (
            <ProblemSectionCard title="Input" icon={ArrowDownToLine}>
              <Markdown className="max-w-3xl">{problem.inputFormat}</Markdown>
            </ProblemSectionCard>
          ) : null}
          {problem.outputFormat ? (
            <ProblemSectionCard title="Output" icon={ArrowUpFromLine}>
              <Markdown className="max-w-3xl">{problem.outputFormat}</Markdown>
            </ProblemSectionCard>
          ) : null}
        </div>
      ) : null}

      {problem.constraints ? (
        <ProblemSectionCard title="Constraints" icon={ShieldAlert}>
          <Markdown className="max-w-3xl">{problem.constraints}</Markdown>
        </ProblemSectionCard>
      ) : null}

      {problem.samples.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
                <FlaskConical className="size-4" />
              </span>
              Samples
            </h2>
            <span className="text-xs text-muted-foreground">
              {problem.samples.length}{" "}
              {problem.samples.length === 1 ? "example" : "examples"}
            </span>
          </div>
          {isSql ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              SQL samples run against the ShopSphere fixture. When a sample shows
              dataset setup, the judge applies it before running your query; the
              expected rows are TSV.
            </p>
          ) : null}
          <div className="space-y-3">
            {problem.samples.map((sample, index) => (
              <SampleCard
                key={sample.id}
                sample={sample}
                index={index}
                sql={isSql}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
