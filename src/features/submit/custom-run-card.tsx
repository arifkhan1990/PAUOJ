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
  findMatchingSample,
  outputsMatch,
  shouldShowNoOutputNotice,
  type RunSample,
} from "./run-sample";

function RunOutcomeChip({
  matched,
  passed,
}: {
  matched: boolean;
  passed: boolean;
}) {
  if (!matched) {
    return (
      <Badge
        variant="muted"
        title="Custom runs show output but are not judged."
      >
        Ran
      </Badge>
    );
  }
  return passed ? (
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

export function CustomRunCard({
  problemId,
  language,
  source,
  samples,
}: {
  problemId: string;
  language: string;
  source: string;
  samples: RunSample[];
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

  // Custom runs are not judged against expected output. The backend reports a
  // clean custom run as EXECUTED (older responses used ACCEPTED); neither is a
  // real verdict, so the badge is replaced by a sample comparison instead.
  const status = result ? (result.status as string) : "";
  const executed = status === "EXECUTED" || status === "ACCEPTED";
  const finished = Boolean(result?.finished);
  const matched =
    result && executed && finished
      ? findMatchingSample(samples, executedStdin)
      : null;
  const passed = result ? outputsMatch(result.stdout, matched?.sample.output ?? "") : false;

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
        >
          Use sample
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Run against your own input. This does not create a submission.
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Custom runs are not judged. Submit for a real verdict.
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
              finished ? (
                <RunOutcomeChip matched={Boolean(matched)} passed={passed} />
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
            <div>
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                Your output
              </p>
              {result.stdout ? (
                <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[11px]">
                  {result.stdout}
                </pre>
              ) : (
                <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[11px] text-muted-foreground">
                  (no output)
                </pre>
              )}
            </div>
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
          {matched ? (
            <div>
              <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                Sample output
              </p>
              <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-2.5 font-mono text-[11px]">
                {matched.sample.output}
              </pre>
            </div>
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
