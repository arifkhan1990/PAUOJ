"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProblemReviewAction } from "@/features/reviews/use-problem-review-action";
import type { ProblemReviewHoldItem } from "@/lib/problem-review-types";

export function HoldThreadActions({
  problemId,
  hold,
  canRespond,
  canResolve,
  canReopen,
}: {
  problemId: string;
  hold: ProblemReviewHoldItem;
  canRespond: boolean;
  canResolve: boolean;
  canReopen: boolean;
}) {
  const { run, pending, error } = useProblemReviewAction(problemId);
  const [response, setResponse] = useState("");
  const [resolveNote, setResolveNote] = useState("");
  const [reopenNote, setReopenNote] = useState("");
  const [showResolve, setShowResolve] = useState(false);
  const [showReopen, setShowReopen] = useState(false);

  if (!canRespond && !canResolve && !canReopen) return null;

  const submitResponse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await run(
      { action: "respond", holdId: hold.id, response: response.trim() },
      { successTitle: "Response sent" },
    );
    if (result) setResponse("");
  };

  const submitResolve = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await run(
      {
        action: "resolve",
        holdId: hold.id,
        note: resolveNote.trim() || undefined,
      },
      {
        successTitle: (result) =>
          result.reopened ? "Hold resolved · review reopened" : "Hold resolved",
        successDescription: "The author has been notified.",
      },
    );
    if (result) {
      setResolveNote("");
      setShowResolve(false);
    }
  };

  const submitReopen = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await run(
      { action: "reopen", holdId: hold.id, note: reopenNote.trim() },
      {
        successTitle: "Hold reopened",
        successDescription: "Approvals stay locked until it is resolved again.",
      },
    );
    if (result) {
      setReopenNote("");
      setShowReopen(false);
    }
  };

  return (
    <div className="space-y-3">
      {canRespond ? (
        <form
          onSubmit={(event) => void submitResponse(event)}
          className="space-y-2 border-t border-border pt-3"
        >
          <Label htmlFor={`response-${hold.id}`}>Your response</Label>
          <Textarea
            id={`response-${hold.id}`}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            rows={3}
            maxLength={2_000}
            placeholder="Explain what you changed, or why the current version is correct."
            required
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">
              At least 10 characters. Every setter is notified.
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={pending || response.trim().length < 10}
            >
              <Send className="size-3.5" />
              {pending ? "Sending…" : "Send response"}
            </Button>
          </div>
        </form>
      ) : null}

      {canResolve ? (
        showResolve ? (
          <form
            onSubmit={(event) => void submitResolve(event)}
            className="space-y-2 border-t border-border pt-3"
          >
            <Label htmlFor={`resolve-${hold.id}`}>
              Resolution note (optional)
            </Label>
            <Textarea
              id={`resolve-${hold.id}`}
              value={resolveNote}
              onChange={(event) => setResolveNote(event.target.value)}
              rows={2}
              maxLength={2_000}
              placeholder="What convinced you the hold is addressed?"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Resolving reopens the review when no other hold is pending.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResolve(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={pending}>
                  <CheckCircle2 className="size-3.5" />
                  {pending ? "Resolving…" : "Resolve hold"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowResolve(true)}
            >
              <CheckCircle2 className="size-3.5" /> Resolve hold
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Only the setter who raised it or an admin can resolve it.
            </p>
          </div>
        )
      ) : null}

      {canReopen ? (
        showReopen ? (
          <form
            onSubmit={(event) => void submitReopen(event)}
            className="space-y-2 border-t border-border pt-3"
          >
            <Label htmlFor={`reopen-${hold.id}`}>Why reopen this hold?</Label>
            <Textarea
              id={`reopen-${hold.id}`}
              value={reopenNote}
              onChange={(event) => setReopenNote(event.target.value)}
              rows={2}
              maxLength={2_000}
              placeholder="The response does not address the issue because…"
              required
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                At least 10 characters. The author is notified.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReopen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={pending || reopenNote.trim().length < 10}
                >
                  <RotateCcw className="size-3.5" />
                  {pending ? "Reopening…" : "Reopen hold"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowReopen(true)}
            >
              <RotateCcw className="size-3.5" /> Reopen hold
            </Button>
          </div>
        )
      ) : null}

      {error ? (
        <p
          role="alert"
          className="text-xs leading-relaxed text-rose-700 dark:text-rose-300"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
