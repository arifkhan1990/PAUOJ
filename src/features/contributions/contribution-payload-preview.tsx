"use client";

import type { ReactNode } from "react";
import { Markdown } from "@/components/shared/markdown";
import { Badge } from "@/components/ui/badge";
import type { ProblemContributionItem } from "@/lib/contribution-types";
import { cn } from "@/lib/utils";

export type CurrentProblemContent = {
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  editorial: string | null;
};

function VersionBlock({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "live" | "proposed";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border p-3",
        tone === "live"
          ? "border-border bg-muted/20"
          : "border-primary/30 bg-primary/5",
      )}
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

function StatementBlocks({
  statement,
  inputFormat,
  outputFormat,
  constraints,
}: {
  statement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
}) {
  return (
    <div className="space-y-3">
      <Markdown>{statement}</Markdown>
      {inputFormat ? (
        <div>
          <p className="text-xs font-semibold">Input format</p>
          <Markdown>{inputFormat}</Markdown>
        </div>
      ) : null}
      {outputFormat ? (
        <div>
          <p className="text-xs font-semibold">Output format</p>
          <Markdown>{outputFormat}</Markdown>
        </div>
      ) : null}
      {constraints ? (
        <div>
          <p className="text-xs font-semibold">Constraints</p>
          <Markdown>{constraints}</Markdown>
        </div>
      ) : null}
    </div>
  );
}

export function ContributionPayloadPreview({
  item,
  current,
}: {
  item: ProblemContributionItem;
  current?: CurrentProblemContent;
}) {
  const payload = item.payload;
  if ("statement" in payload) {
    return (
      <div className="space-y-3">
        {current ? (
          <p className="text-[11px] text-muted-foreground">
            Side-by-side comparison with the live problem.
          </p>
        ) : null}
        <div className={cn("grid gap-3", current && "lg:grid-cols-2")}>
          {current ? (
            <VersionBlock label="Live version" tone="live">
              <StatementBlocks
                statement={current.statement}
                inputFormat={current.inputFormat}
                outputFormat={current.outputFormat}
                constraints={current.constraints}
              />
            </VersionBlock>
          ) : null}
          <VersionBlock
            label={current ? "Proposed version" : "Proposed statement"}
            tone="proposed"
          >
            <StatementBlocks
              statement={payload.statement}
              inputFormat={payload.inputFormat}
              outputFormat={payload.outputFormat}
              constraints={payload.constraints}
            />
          </VersionBlock>
        </div>
      </div>
    );
  }
  if ("editorial" in payload) {
    return (
      <div className="space-y-3">
        {current ? (
          <p className="text-[11px] text-muted-foreground">
            Side-by-side comparison with the live editorial.
          </p>
        ) : null}
        <div className={cn("grid gap-3", current && "lg:grid-cols-2")}>
          {current ? (
            <VersionBlock label="Live version" tone="live">
              {current.editorial ? (
                <Markdown>{current.editorial}</Markdown>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No editorial has been published yet.
                </p>
              )}
            </VersionBlock>
          ) : null}
          <VersionBlock
            label={current ? "Proposed version" : "Proposed editorial"}
            tone="proposed"
          >
            <Markdown>{payload.editorial}</Markdown>
          </VersionBlock>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {payload.tests.map((test, index) => (
        <div
          key={index}
          className="rounded-md border border-border bg-background p-2"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[11px] text-muted-foreground">
              Test {index + 1}
            </span>
            <Badge variant={test.isSample ? "accent" : "muted"}>
              {test.isSample ? "Sample" : "Hidden"}
            </Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Input
              </p>
              <pre className="mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted/40 p-2 font-mono text-[11px]">
                {test.input || "(empty)"}
              </pre>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Expected output
              </p>
              <pre className="mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted/40 p-2 font-mono text-[11px]">
                {test.expectedOutput || "(empty)"}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

