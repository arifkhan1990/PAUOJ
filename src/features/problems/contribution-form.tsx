"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePenLine } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { MarkdownField } from "@/components/admin/markdown-field";
import { TestCaseEditor, type TestForm } from "@/components/admin/test-case-editor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost } from "@/lib/api-client";
import {
  PROBLEM_CONTRIBUTION_KINDS,
  CONTRIBUTION_KIND_LABELS,
  type ProblemContributionKind,
} from "@/lib/contribution-types";
import { problemContributionInputSchema } from "@/lib/schemas/problem-contribution";
import { cn } from "@/lib/utils";

type StatementValues = {
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
};

const KIND_HINTS: Record<ProblemContributionKind, string> = {
  STATEMENT:
    "Replace the public statement, input/output format and constraints. The author sees your draft before it goes live.",
  TESTS:
    "New tests are appended to the existing suite after the author approves. Existing hidden tests are never shown or replaced.",
  EDITORIAL:
    "Write the approach, complexity and reference code. The author reviews it before it appears on the problem.",
};

export function ContributionForm({
  slug,
  initialKind,
  allowedKinds = [...PROBLEM_CONTRIBUTION_KINDS],
  initialStatement,
  initialEditorial,
}: {
  slug: string;
  initialKind: ProblemContributionKind;
  allowedKinds?: ProblemContributionKind[];
  initialStatement: StatementValues;
  initialEditorial: string | null;
}) {
  const [kind, setKind] = useState<ProblemContributionKind>(() =>
    allowedKinds.includes(initialKind)
      ? initialKind
      : (allowedKinds[0] ?? "EDITORIAL"),
  );
  const [statement, setStatement] = useState<StatementValues>(initialStatement);
  const [editorial, setEditorial] = useState(initialEditorial ?? "");
  const [note, setNote] = useState("");
  const [tests, setTests] = useState<TestForm[]>([
    { input: "", expectedOutput: "", isSample: true },
    { input: "", expectedOutput: "", isSample: false },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const updateStatement = (patch: Partial<StatementValues>) => {
    setStatement((current) => ({ ...current, ...patch }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload =
      kind === "STATEMENT"
        ? statement
        : kind === "TESTS"
          ? { tests }
          : { editorial };
    const parsed = problemContributionInputSchema.safeParse({
      kind,
      note,
      payload,
    });
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
          .join(" · "),
      );
      return;
    }

    setLoading(true);
    try {
      await apiPost(`/api/v1/problems/${slug}/contributions`, parsed.data);
      toast({
        title: "Proposal sent",
        description: "The problem author will review it before it goes live.",
        variant: "success",
      });
      router.push("/teacher/contributions");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof ApiClientError
          ? submitError.message
          : "Could not send the proposal.";
      setError(message);
      toast({ title: "Proposal failed", description: message, variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-5">
      <Card className="p-5">
        {allowedKinds.length > 1 ? (
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {allowedKinds.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  kind === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {CONTRIBUTION_KIND_LABELS[value]}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-medium">
            <FilePenLine className="size-4 text-primary" />
            {CONTRIBUTION_KIND_LABELS[kind]}
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{KIND_HINTS[kind]}</p>
      </Card>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs leading-relaxed text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-100"
        >
          {error}
        </div>
      ) : null}

      {kind === "STATEMENT" ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold">Proposed statement</h2>
          <MarkdownField
            id="statement"
            label="Problem statement"
            value={statement.statement}
            onChange={(value) => updateStatement({ statement: value })}
            rows={10}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <MarkdownField
              id="inputFormat"
              label="Input format"
              value={statement.inputFormat}
              onChange={(value) => updateStatement({ inputFormat: value })}
              rows={4}
            />
            <MarkdownField
              id="outputFormat"
              label="Output format"
              value={statement.outputFormat}
              onChange={(value) => updateStatement({ outputFormat: value })}
              rows={4}
            />
          </div>
          <MarkdownField
            id="constraints"
            label="Constraints"
            value={statement.constraints}
            onChange={(value) => updateStatement({ constraints: value })}
            rows={4}
          />
        </Card>
      ) : null}

      {kind === "TESTS" ? (
        <Card className="p-5">
          <TestCaseEditor tests={tests} onChange={setTests} />
        </Card>
      ) : null}

      {kind === "EDITORIAL" ? (
        <Card className="space-y-4 p-5">
          <MarkdownField
            id="editorial"
            label="Proposed editorial"
            value={editorial}
            onChange={setEditorial}
            rows={12}
            placeholder={
              "Explain the key idea, complexity and reference solution.\n\n```cpp\n// code\n```"
            }
          />
        </Card>
      ) : null}

      <Card className="space-y-2 p-5">
        <Label htmlFor="note">Note for the author (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={1_000}
          placeholder="What changed and why should this be approved?"
        />
        <p className="text-[11px] text-muted-foreground">
          Only the problem author and admins can see this note.
        </p>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          <FilePenLine className="size-4" />
          {loading ? "Sending…" : "Send for review"}
        </Button>
      </div>
    </form>
  );
}
