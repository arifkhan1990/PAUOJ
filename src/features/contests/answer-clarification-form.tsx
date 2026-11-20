"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiPatch } from "@/lib/api-client";

const MAX_LENGTH = 5000;

export function AnswerClarificationForm({
  slug,
  clarificationId,
}: {
  slug: string;
  clarificationId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = answer.trim();
    if (value.length < 2 || submitting) return;
    setSubmitting(true);
    try {
      await apiPatch(
        `/api/v1/contests/${slug}/clarifications/${clarificationId}`,
        { answer: value },
      );
      setAnswer("");
      toast({ title: "Answer published", variant: "success" });
      router.refresh();
    } catch (error) {
      toast({
        title: "Could not publish the answer",
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
    <form onSubmit={submit} className="mt-3 rounded-lg border border-border bg-muted/20 p-3">
      <label
        htmlFor={`answer-${clarificationId}`}
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        Answer as organiser / problem author
      </label>
      <Textarea
        id={`answer-${clarificationId}`}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        maxLength={MAX_LENGTH}
        placeholder="Publish an official answer visible to every participant."
        className="min-h-20 bg-background"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {answer.length}/{MAX_LENGTH}
        </span>
        <Button type="submit" size="sm" disabled={submitting || answer.trim().length < 2}>
          {submitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <MessageSquare className="size-3.5" />
          )}
          Publish answer
        </Button>
      </div>
    </form>
  );
}
