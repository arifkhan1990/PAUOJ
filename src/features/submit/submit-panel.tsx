"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Code2,
  FlaskConical,
  Loader2,
  LogIn,
  RotateCcw,
  Send,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ApiClientError, apiPost } from "@/lib/api-client";
import { getLanguage, LANGUAGES, type LanguageId } from "@/lib/languages";
import { isPendingVerdict, verdictMeta } from "@/lib/verdicts";
import { CodeEditor } from "./code-editor";
import { CustomRunCard } from "./custom-run-card";
import { useSubmissionStream } from "./use-submission-stream";
import { VerdictCard } from "./verdict-card";

const STARTERS: Record<LanguageId, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // read input and print the answer

    return 0;
}
`,
  c: `#include <stdio.h>

int main(void) {
    // read input and print the answer
    return 0;
}
`,
  python: `import sys

def solve() -> None:
    data = sys.stdin.read().split()
    # write your solution here

if __name__ == "__main__":
    solve()
`,
  java: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // write your solution here
    }
}
`,
  javascript: `const input = require("fs").readFileSync(0, "utf8").trim().split(/\\s+/);
// write your solution here
`,
  csharp: `using System;

class Program {
    static void Main() {
        string input = Console.In.ReadToEnd();
        // write your solution here
    }
}
`,
  go: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    for scanner.Scan() {
        _ = scanner.Text()
    }
    fmt.Print("")
}
`,
  php: `<?php
$input = trim(file_get_contents("php://stdin"));
// write your solution here
`,
  kotlin: `import java.util.Scanner

fun main() {
    val scanner = Scanner(System.\`in\`)
    // write your solution here
}
`,
  swift: `import Foundation

let input = String(data: FileHandle.standardInput.readDataToEndOfFile(), encoding: .utf8) ?? ""
// write your solution here
`,
};

function draftKey(problemId: string, language: string): string {
  return `pauoj:draft:${problemId}:${language}`;
}

function readDraft(problemId: string, language: string): string | null {
  try {
    return window.localStorage.getItem(draftKey(problemId, language));
  } catch {
    return null;
  }
}

function writeDraft(problemId: string, language: string, value: string): void {
  try {
    window.localStorage.setItem(draftKey(problemId, language), value);
  } catch {
    // Storage can be unavailable in private mode; drafts are best-effort.
  }
}

export function SubmitPanel({
  problemId,
  contestId,
  assessmentId,
  virtualContestId,
  timeLimitMs,
  memoryLimitMb,
  sampleInput,
  canSubmit,
  loginNext,
  defaultLanguage = "cpp",
}: {
  problemId: string;
  contestId?: string | null;
  assessmentId?: string | null;
  virtualContestId?: string | null;
  timeLimitMs: number;
  memoryLimitMb: number;
  sampleInput: string;
  canSubmit: boolean;
  loginNext: string;
  defaultLanguage?: LanguageId;
}) {
  const [language, setLanguage] = useState<LanguageId>(defaultLanguage);
  const [source, setSource] = useState(STARTERS[defaultLanguage]);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRun, setShowRun] = useState(false);
  const lastNotified = useRef("");
  const { submission, connecting } = useSubmissionStream(submissionId);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const saved = readDraft(problemId, defaultLanguage);
    if (saved !== null) setSource(saved);
    setHydrated(true);
  }, [problemId, defaultLanguage]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      writeDraft(problemId, language, source);
    }, 500);
    return () => clearTimeout(timer);
  }, [source, language, hydrated, problemId]);

  useEffect(() => {
    if (!submission) return;
    const key = `${submission.id}:${submission.status}`;
    if (lastNotified.current === key) return;
    if (!isPendingVerdict(submission.status)) {
      lastNotified.current = key;
      const meta = verdictMeta(submission.status);
      toast({
        title: meta.label,
        description: meta.description,
        variant:
          submission.status === "ACCEPTED"
            ? "success"
            : submission.status === "SYSTEM_ERROR"
              ? "error"
              : "warning",
      });
    }
  }, [submission, toast]);

  const changeLanguage = (next: LanguageId) => {
    if (next === language) return;
    writeDraft(problemId, language, source);
    const saved = readDraft(problemId, next);
    setLanguage(next);
    setSource(saved ?? STARTERS[next]);
  };

  const resetCode = () => {
    if (!window.confirm("Clear your saved draft for this language?")) return;
    setSource(STARTERS[language]);
    try {
      window.localStorage.removeItem(draftKey(problemId, language));
    } catch {
      // Ignore storage failures.
    }
  };

  const loginHref = `/login?next=${encodeURIComponent(loginNext)}`;

  const submit = async () => {
    if (!canSubmit) {
      router.push(loginHref);
      return;
    }
    if (!source.trim()) {
      toast({
        title: "Nothing to submit",
        description: "Write some code before submitting.",
        variant: "warning",
      });
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmissionId(null);
    try {
      const result = await apiPost<{ id: string }>("/api/v1/submissions", {
        problemId,
        contestId: contestId ?? null,
        assessmentId: assessmentId ?? null,
        virtualContestId: virtualContestId ?? null,
        language,
        source,
      });
      lastNotified.current = "";
      setSubmissionId(result.id);
      toast({
        title: "Submission queued",
        description: "The live verdict will appear on the right.",
        variant: "info",
      });
    } catch (submitError) {
      if (submitError instanceof ApiClientError && submitError.status === 401) {
        router.push(loginHref);
        return;
      }
      const message =
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not submit your code.";
      setError(message);
      toast({ title: "Submission failed", description: message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!canSubmit) {
    return (
      <Card className="flex flex-col items-center justify-center p-10 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted text-primary">
          <Code2 className="size-6" />
        </span>
        <h3 className="mt-4 text-base font-semibold">Sign in to solve this problem</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Your submissions, verdicts, drafts and contest score are tied to your
          account. Registration is free.
        </p>
        <div className="mt-5 flex gap-2">
          <Link href={loginHref} className={buttonVariants()}>
            <LogIn className="size-4" /> Sign in
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(loginNext)}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Create account
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SearchableSelect
              value={language}
              onValueChange={(next) => changeLanguage(next as LanguageId)}
              options={LANGUAGES.map((item) => ({
                value: item.id,
                label: item.label,
              }))}
              aria-label="Programming language"
              className="h-9 w-52 text-xs"
            />
            <span className="text-[11px] text-muted-foreground">
              {getLanguage(language).compiler}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">
              {hydrated ? "Draft saved locally" : "Loading draft…"}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={resetCode}>
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          </div>
        </div>

        <CodeEditor
          problemId={problemId}
          language={language}
          value={source}
          onChange={setSource}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {source.length.toLocaleString("en-US")} characters ·{" "}
            {timeLimitMs} ms · {memoryLimitMb} MB
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRun((value) => !value)}
            >
              <FlaskConical className="size-4" />
              {showRun ? "Hide custom test" : "Custom test"}
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={submitting}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {submitting ? "Submitting…" : "Submit solution"}
            </Button>
          </div>
        </div>

        {showRun ? (
          <CustomRunCard
            problemId={problemId}
            language={language}
            source={source}
            sampleInput={sampleInput}
          />
        ) : null}
      </div>

      <div className="space-y-4" id="verdict">
        <VerdictCard
          submission={submission}
          submitting={submitting || connecting}
          error={error}
          timeLimitMs={timeLimitMs}
          memoryLimitMb={memoryLimitMb}
        />
        <Card className="p-4">
          <h3 className="text-sm font-semibold">Before you submit</h3>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li>Read from standard input and write to standard output.</li>
            <li>Do not print extra prompts, labels or debug output.</li>
            <li>Java submissions must use a public class named Main.</li>
            <li>Trailing spaces and trailing newlines are ignored.</li>
            <li>Use fast I/O when the input is large.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
