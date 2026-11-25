"use client";

import { useEffect, useRef, useState } from "react";
import { FlaskConical, Loader2, Play } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { VerdictBadge } from "@/components/shared/verdict-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost, apiRequest } from "@/lib/api-client";
import type { RunResult } from "@/lib/types";
import { formatMemory, formatRuntime } from "@/lib/utils";
import {
  resolveRunComparison,
  shouldShowNoOutputNotice,
  type RunComparison,
  type RunSample,
} from "./run-sample";

function RunOutcomeChip({ comparison }: { comparison: RunComparison }) {
  if (comparison.kind === "sample") {
    return comparison.matches === true ? (
      <Badge
        variant="success"
        title="Your output matches this sample. Submit for a real verdict."
      >
        Sample passed
      </Badge>
    ) : (
      <Badge
        variant="destructive"
        title="Your output differs from this sample. Custom runs are not judged."
      >
        Differs from sample
      </Badge>
    );
  }
  if (comparison.kind === "reference") {
    if (comparison.matches === true) {
      return (
        <Badge
          variant="success"
          title="Your output matches the reference solution. Submit for a real verdict."
        >
          Matches expected
        </Badge>
      );
    }
    if (comparison.matches === false) {
      return (
        <Badge
          variant="destructive"
          title="Your output differs from the reference solution. Custom runs are not judged."
        >
          Differs from expected
        </Badge>
      );
    }
    return (
      <Badge
        variant="muted"
        title="The reference solution produced this output; your output was not compared."
      >
        Reference output
      </Badge>
    );
  }
  return (
    <Badge variant="muted" title="Custom runs show output but are not judged.">
      Ran
    </Badge>
  );
}

function RunOutputBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
      <pre
        className={
          value.length > 0
            ? "max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[11px]"
            : "max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[11px] text-muted-foreground"
        }
      >
        {value.length > 0 ? value : "(no output)"}
      </pre>
    </div>
  );
}

export function CustomRunCard({
  problemId,
  language,
  source,
  samples,
  judgeLanguage,
}: {
  problemId: string;
  language: string;
  source: string;
  samples: RunSample[];
  judgeLanguage?: string | null;
}) {
  const [stdin, setStdin] = useState(samples[0]?.input ?? "");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [executedStdin, setExecutedStdin] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const poll = async (runId: string, deadline: number) => {
    try {
      const next = await apiRequest<RunResult>(`/api/v1/runs/${runId}`);
      setResult(next);
      if (!next.finished && Date.now() < deadline) {
        timerRef.current = setTimeout(() => void poll(runId, deadline), 700);
      } else {
        setRunning(false);
      }
    } catch (pollError) {
      setRunning(false);
      const message =
        pollError instanceof ApiClientError
          ? pollError.message
          : "Could not read the run result.";
      setError(message);
    }
  };

  const run = async () => {
    if (!source.trim()) {
      toast({
        title: "Nothing to run",
        description: "Write some code first.",
        variant: "warning",
      });
      return;
    }
    setRunning(true);
    setError(null);
    setResult(null);
    setExecutedStdin(stdin);
    try {
      const { runId } = await apiPost<{ runId: string }>("/api/v1/runs", {
        problemId,
        language,
        source,
        stdin,
      });
      await poll(runId, Date.now() + 90_000);
    } catch (runError) {
      setRunning(false);
      const message =
        runError instanceof ApiClientError
          ? runError.message
          : "Could not start the run.";
      setError(message);
      toast({ title: "Run failed", description: message, variant: "error" });
    }
  };

  // Custom runs are not judged. The backend reports a clean custom run as
  // EXECUTED (older responses used ACCEPTED); neither is a real verdict, so the
  // badge is replaced by a sample/reference comparison instead.
  const status = result ? (result.status as string) : "";
  const executed = status === "EXECUTED" || status === "ACCEPTED";
  const finished = Boolean(result?.finished);
  const isSqlProblem =
    judgeLanguage === "sql" || judgeLanguage === "sql-script";
  const comparison =
    result && finished
      ? resolveRunComparison({
          samples: isSqlProblem ? [] : samples,
          stdin: executedStdin,
          stdout: result.stdout,
          expectedOutput: result.expectedOutput,
          matchesExpected: result.matchesExpected,
        })
      : null;
  const expectedNote = result?.expectedNote?.trim() || null;
  const showExpectedNote =
    Boolean(expectedNote) && finished && comparison?.kind !== "sample";
  const showUnavailableNote =
    finished && comparison?.kind === "none" && !expectedNote;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <FlaskConical className="size-4 text-primary" /> Custom test
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setStdin(samples[0]?.input ?? "")}
          className={isSqlProblem ? "invisible" : undefined}
          aria-hidden={isSqlProblem || undefined}
          tabIndex={isSqlProblem ? -1 : undefined}
        >
          Use sample
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Run against your own input. This does not create a submission.
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Custom runs compare against the reference solution when available. They
        are not official verdicts.
      </p>
      <Textarea
        value={stdin}
        onChange={(event) => setStdin(event.target.value)}
        placeholder="Standard input for your program…"
        className="mt-3 min-h-24 font-mono text-xs"
        spellCheck={false}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {stdin.length.toLocaleString("en-US")} / 16,384 characters
        </span>
        <Button
          type="button"
          size="sm"
          onClick={() => void run()}
          disabled={running || stdin.length > 16_384}
        >
          {running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          {running ? "Running…" : "Run"}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {executed ? (
              finished && comparison ? (
                <RunOutcomeChip comparison={comparison} />
              ) : null
            ) : (
              <VerdictBadge status={result.status} />
            )}
            <span className="font-mono text-muted-foreground">
              {formatRuntime(result.runtimeMs)}
            </span>
            <span className="font-mono text-muted-foreground">
              {formatMemory(result.memoryKb)}
            </span>
            {!result.finished ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          {result.compileOutput ? (
            <div>
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                Compiler output
              </p>
              <pre className="max-h-40 overflow-auto rounded-md bg-[#0d1117] p-2.5 font-mono text-[11px] text-slate-300">
                {result.compileOutput}
              </pre>
            </div>
          ) : null}
          {executed && finished ? (
            <RunOutputBlock label="Your output" value={result.stdout} />
          ) : result.stdout ? (
            <div>
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                stdout
              </p>
              <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[11px]">
                {result.stdout}
              </pre>
            </div>
          ) : null}
          {comparison?.kind === "sample" ? (
            <RunOutputBlock
              label="Sample output"
              value={comparison.expected ?? ""}
            />
          ) : null}
          {comparison?.kind === "reference" ? (
            <RunOutputBlock
              label="Expected output (reference)"
              value={comparison.expected ?? ""}
            />
          ) : null}
          {result.stderr ? (
            <div>
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                stderr
              </p>
              <pre className="max-h-40 overflow-auto rounded-md border border-rose-200 bg-rose-50 p-2.5 font-mono text-[11px] text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                {result.stderr}
              </pre>
            </div>
          ) : null}
          {showExpectedNote ? (
            <p className="text-xs text-muted-foreground">{expectedNote}</p>
          ) : null}
          {showUnavailableNote ? (
            <p className="text-xs text-muted-foreground">
              Expected output isn&apos;t available for this run.
            </p>
          ) : null}
          {shouldShowNoOutputNotice(result) ? (
            <p className="text-xs text-muted-foreground">
              Program finished with no output.
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
