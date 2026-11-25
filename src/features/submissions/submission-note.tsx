"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Lock, Save, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiDelete, apiPut } from "@/lib/api-client";
import { submissionNoteInputSchema } from "@/lib/schemas/submission";

const NOTE_LIMIT = 2_000;

type NoteResponse = { note: string | null };

type PendingAction = "save" | "delete";

/**
 * Private note for the submission owner. The API is owner-only, so the page
 * renders this card only when the viewer owns the submission.
 */
export function SubmissionNote({
  submissionId,
  initialNote,
}: {
  submissionId: string;
  initialNote: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const textareaId = useId();
  const errorId = `${textareaId}-error`;

  const [savedNote, setSavedNote] = useState(initialNote);
  const [draft, setDraft] = useState(initialNote ?? "");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSavedNote(initialNote);
  }, [initialNote]);

  const apiPath = `/api/v1/submissions/${encodeURIComponent(submissionId)}/notes`;
  const trimmed = draft.trim();
  const dirty = trimmed !== (savedNote ?? "").trim();
  const canSave = trimmed.length > 0 && dirty && pending === null;

  const save = async () => {
    const parsed = submissionNoteInputSchema.safeParse({ body: draft });
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Check your note and try again.";
      setError(message);
      toast({ title: "Check your note", description: message, variant: "warning" });
      return;
    }

    setError(null);
    setPending("save");
    try {
      const result = await apiPut<NoteResponse>(apiPath, parsed.data);
      setSavedNote(result.note);
      setDraft(result.note ?? "");
      toast({
        title: "Note saved",
        description: "Saved just now. Only you can see it.",
        variant: "success",
      });
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not save this note.";
      setError(message);
      toast({ title: "Save failed", description: message, variant: "error" });
    } finally {
      setPending(null);
    }
  };

  const remove = async () => {
    if (pending) return;
    setError(null);
    setPending("delete");
    try {
      await apiDelete<NoteResponse>(apiPath);
      setSavedNote(null);
      setDraft("");
      setConfirmOpen(false);
      toast({ title: "Note deleted", variant: "success" });
      router.refresh();
    } catch (requestError) {
      const message =
        requestError instanceof ApiClientError
          ? requestError.message
          : "Could not delete this note.";
      setError(message);
      toast({ title: "Delete failed", description: message, variant: "error" });
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-4 py-3 sm:px-5">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <FileText className="size-4" aria-hidden="true" />
            Your notes
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            Only you can see this
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <label htmlFor={textareaId} className="sr-only">
            Your private notes for this submission
          </label>
          <Textarea
            id={textareaId}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            rows={5}
            maxLength={NOTE_LIMIT}
            placeholder="Write your notes here"
            className="min-h-28 resize-y text-sm"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            disabled={pending !== null}
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {draft.length}/{NOTE_LIMIT}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {savedNote ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="min-h-11 min-w-11 text-destructive hover:text-destructive lg:min-h-9"
                  onClick={() => setConfirmOpen(true)}
                  disabled={pending !== null}
                  aria-busy={pending === "delete"}
                >
                  {pending === "delete" ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 aria-hidden="true" />
                  )}
                  {pending === "delete" ? "Deleting…" : "Delete"}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                className="min-h-11 lg:min-h-9"
                onClick={() => void save()}
                disabled={!canSave}
                aria-busy={pending === "save"}
              >
                {pending === "save" ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save aria-hidden="true" />
                )}
                {pending === "save" ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>

          {error ? (
            <p
              id={errorId}
              role="alert"
              className="mt-1 text-[11px] font-medium text-rose-700 dark:text-rose-300"
            >
              {error}
            </p>
          ) : null}
        </div>
      </Card>

      {savedNote ? (
        <ConfirmDialog
          open={confirmOpen}
          title="Delete this note?"
          description="Your private note will be removed from this submission. This cannot be undone."
          confirmLabel="Delete note"
          pending={pending === "delete"}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
    </>
  );
}
