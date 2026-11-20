"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FlaskConical,
  HardDrive,
  Loader2,
  XCircle,
} from "lucide-react";
import { VerdictBadge } from "@/components/shared/verdict-badge";
import { Card } from "@/components/ui/card";
import type { SubmissionDetail } from "@/lib/types";
import {
  formatMemory,
  formatRuntime,
  shortId,
} from "@/lib/utils";
import { isPendingVerdict, verdictMeta } from "@/lib/verdicts";
import { cn } from "@/lib/utils";

function TestDots({ submission }: { submission: SubmissionDetail }) {
  if (submission.results.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {submission.results.map((result) => {
        const meta = verdictMeta(result.status);
        return (
          <span
            key={result.position}
            title={`Test ${result.position}: ${meta.label}`}
            className={cn("size-2.5 rounded-sm", meta.dotClassName)}
          />
        );
      })}
    </div>
  );
}

export function VerdictCard({
  submission,
  submitting,
  error,
  timeLimitMs,
  memoryLimitMb,
}: {
  submission: SubmissionDetail | null;
  submitting: boolean;
  error: string | null;
  timeLimitMs: number;
  memoryLimitMb: number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Verdict</h3>
        {submission ? <VerdictBadge status={submission.status} short /> : null}
      </div>

      {error ? (
        <div className="mt-3 flex gap-2 rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {submitting ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Sending your code to the judge…
        </div>
      ) : null}

      {!submission && !submitting ? (
        <div className="mt-3 space-y-2.5 text-sm">
          <p className="text-muted-foreground">
            Submit when you are ready. Every test runs in an isolated sandbox.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock3 className="size-4" />
            Time limit{" "}
            <span className="font-mono text-foreground">
              {timeLimitMs} ms
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <HardDrive className="size-4" />
            Memory limit{" "}
            <span className="font-mono text-foreground">
              {memoryLimitMb} MB
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FlaskConical className="size-4" />
            Hidden tests are revealed only as pass/fail.
          </div>
        </div>
      ) : null}

      {submission ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">
            {verdictMeta(submission.status).description}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-border bg-muted/40 p-2.5">
              <p className="text-muted-foreground">Tests</p>
              <p className="mt-0.5 font-mono text-sm font-semibold">
                {submission.passedTests}/{submission.totalTests}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-2.5">
              <p className="text-muted-foreground">Runtime</p>
              <p className="mt-0.5 font-mono text-sm font-semibold">
                {formatRuntime(submission.runtimeMs)}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-2.5">
              <p className="text-muted-foreground">Memory</p>
              <p className="mt-0.5 font-mono text-sm font-semibold">
                {formatMemory(submission.memoryKb)}
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-2.5">
              <p className="text-muted-foreground">Submission</p>
              <p className="mt-0.5 font-mono text-sm font-semibold">
                {shortId(submission.id)}
              </p>
            </div>
          </div>

          {isPendingVerdict(submission.status) ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Live updates are on.
            </div>
          ) : null}
          <TestDots submission={submission} />

          {submission.compileOutput ? (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Compiler output
              </p>
              <pre className="max-h-52 overflow-auto rounded-md bg-[#0d1117] p-3 font-mono text-[11px] leading-relaxed text-slate-300">
                {submission.compileOutput}
              </pre>
            </div>
          ) : null}

          {submission.status === "ACCEPTED" ? (
            <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-4" /> All tests passed.
            </p>
          ) : null}

          <Link
            href={`/submissions/${submission.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Open full submission <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
