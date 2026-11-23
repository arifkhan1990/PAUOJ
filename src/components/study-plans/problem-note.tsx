"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiClientError, apiDelete, apiPut } from "@/lib/api-client";
import { studyListNoteInputSchema } from "@/lib/schemas/study-list";

const NOTE_LIMIT = 2_000;

type NoteResponse = { note: string | null };

type PendingAction = "save" | "delete";

/**
 * Private per-problem note inside a study plan. Rendered below the problem
 * link for signed-in viewers only; guests never see note UI.
 */
export function ProblemNote({
  planSlug,
  problemSlug,
  problemTitle,
  note,
}: {
  planSlug: string;
  problemSlug: string;
  problemTitle: string;
  note: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const textareaId = useId();
  const errorId = `${textareaId}-error`;
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [savedNote, setSavedNote] = useState(note);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note ?? "");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSavedNote(note);
  }, [note]);

  const apiPath = `/api/v1/lists/${encodeURIComponent(planSlug)}/notes/${encodeURIComponent(problemSlug)}`;

  const openEditor = () => {
    setDraft(savedNote ?? "");
    setError(null);
    setEditing(true);
  };

  const closeEditor = () => {
    setEditing(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const cancelEditor = () => {
    if (pending) return;
    setDraft(savedNote ?? "");
    setError(null);
    closeEditor();
  };

  const save = async () => {
    const parsed = studyListNoteInputSchema.safeParse({ body: draft });
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
      closeEditor();
      toast({ title: "Note saved", variant: "success" });
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
    if (!window.confirm("Delete this note? This cannot be undone.")) return;

    setError(null);
    setPending("delete");
    try {
      await apiDelete<NoteResponse>(apiPath);
      setSavedNote(null);
      setDraft("");
      closeEditor();
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
    <div className="border-t border-border/60 px-4 py-2.5 sm:px-5">
      {editing ? (
        <div className="max-w-2xl">
          <label htmlFor={textareaId} className="sr-only">
            Private note for {problemTitle}
          </label>
          <Textarea
            id={textareaId}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            rows={4}
            maxLength={NOTE_LIMIT}
            placeholder="Note the key idea, invariant or the bug you keep hitting."
            className="min-h-24 text-sm"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            disabled={pending !== null}
            autoFocus
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {draft.length}/{NOTE_LIMIT}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                className="min-h-11 sm:min-h-8"
                onClick={() => void save()}
                disabled={pending !== null}
                aria-busy={pending === "save"}
              >
                {pending === "save" ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save aria-hidden="true" />
                )}
                {pending === "save" ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 sm:min-h-8"
                onClick={cancelEditor}
                disabled={pending !== null}
              >
                <X aria-hidden="true" />
                Cancel
              </Button>
              {savedNote ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="min-h-11 text-destructive hover:text-destructive sm:min-h-8"
                  onClick={() => void remove()}
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
      ) : savedNote ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              Your note
            </p>
            <p className="mt-0.5 line-clamp-3 whitespace-pre-line break-words text-xs leading-relaxed text-foreground/90">
              {savedNote}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-11 shrink-0 sm:min-h-8"
            onClick={openEditor}
            ref={triggerRef}
            aria-label={`Edit note for ${problemTitle}`}
          >
            <Pencil aria-hidden="true" />
            Edit note
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="min-h-11 sm:min-h-8"
          onClick={openEditor}
          ref={triggerRef}
          aria-label={`Add a private note for ${problemTitle}`}
        >
          <Plus aria-hidden="true" />
          Add note
        </Button>
      )}
    </div>
  );
}
