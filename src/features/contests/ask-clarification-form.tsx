"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPost } from "@/lib/api-client";
import type { ContestProblemOption } from "@/lib/types";

const MAX_LENGTH = 2000;

export function AskClarificationForm({
  slug,
  problems,
}: {
  slug: string;
  problems: ContestProblemOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [problemId, setProblemId] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = question.trim();
    if (value.length < 5 || submitting) return;
    setSubmitting(true);
    try {
      await apiPost(`/api/v1/contests/${slug}/clarifications`, {
        problemId: problemId || null,
        question: value,
      });
      setQuestion("");
      setProblemId("");
      toast({ title: "Clarification submitted", variant: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not submit your question",
        description:
          error instanceof ApiClientError
            ? error.message
            : "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label
              htmlFor="clarification-problem"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Problem
            </label>
            <Select
              id="clarification-problem"
              value={problemId}
              onChange={(event) => setProblemId(event.target.value)}
              className="h-9 text-xs"
            >
              <option value="">General question</option>
              {problems.map((problem) => (
                <option key={problem.id} value={problem.id}>
                  {problem.label}. {problem.title}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={submitting || question.trim().length < 5}>
            {submitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
            Ask
          </Button>
        </div>
        <div>
          <label
            htmlFor="clarification-question"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Question
          </label>
          <Textarea
            id="clarification-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="Ask about the statement, constraints or a sample. Do not post solution code."
            className="min-h-24"
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            {question.length}/{MAX_LENGTH}
          </p>
        </div>
      </form>
    </Card>
  );
}
