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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiClientError, apiDelete, apiPut } from "@/lib/api-client";
import { studyListNoteInputSchema } from "@/lib/schemas/study-list";

const NOTE_LIMIT = 2_000;

type NoteResponse = { note: string | null };

type PendingAction = "save" | "delete";

/**
 * Private per-problem note for signed-in viewers. The trigger sits in the
 * problem row (outside the problem link); the preview and editor span the row
 * underneath, so opening a note never nests a button inside a link.
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
  const panelId = `${textareaId}-panel`;
  const errorId = `${textareaId}-error`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);

  const [savedNote, setSavedNote] = useState(note);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note ?? "");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSavedNote(note);
  }, [note]);

  const apiPath = `/api/v1/lists/${encodeURIComponent(planSlug)}/notes/${encodeURIComponent(problemSlug)}`;

  const openEditor = (from?: HTMLButtonElement | null) => {
    returnFocusRef.current = from ?? triggerRef.current;
    setDraft(savedNote ?? "");
    setError(null);
    setEditing(true);
  };

  const closeEditor = (focusRowTrigger = false) => {
    setEditing(false);
    const target = focusRowTrigger
      ? triggerRef.current
      : (returnFocusRef.current ?? triggerRef.current);
    requestAnimationFrame(() => target?.focus());
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
    setError(null);
    setPending("delete");
    try {
      await apiDelete<NoteResponse>(apiPath);
      setSavedNote(null);
      setDraft("");
      setConfirmOpen(false);
      closeEditor(true);
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

  const triggerLabel = savedNote
    ? `Edit note for ${problemTitle}`
    : `Add a private note for ${problemTitle}`;
  const TriggerIcon = savedNote ? FileText : Plus;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        ref={triggerRef}
        onClick={(event) => openEditor(event.currentTarget)}
        aria-label={triggerLabel}
        aria-expanded={editing}
        aria-controls={editing ? panelId : undefined}
        title={savedNote ? "Edit note" : "Add note"}
        className="col-start-2 row-start-1 my-1 mr-1.5 min-h-11 min-w-11 gap-1.5 self-center px-2.5 text-muted-foreground lg:min-h-9 lg:min-w-9"
      >
        <TriggerIcon aria-hidden="true" />
        <span className="hidden sm:inline">
          {savedNote ? "Note" : "Add note"}
        </span>
      </Button>

      {editing ? (
        <div
          id={panelId}
          className="col-span-2 row-start-2 border-t border-border/60 bg-muted/20 px-4 py-3 sm:px-5"
        >
          <div className="max-w-2xl" aria-busy={pending !== null}>
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
                  className="min-h-11 lg:min-h-8"
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
                  className="min-h-11 lg:min-h-8"
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
                    className="min-h-11 min-w-11 text-destructive hover:text-destructive lg:min-h-8"
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
        </div>
      ) : savedNote ? (
        <div className="col-span-2 row-start-2 border-t border-border/60 bg-muted/20 px-4 py-2.5 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                <FileText className="size-3.5 shrink-0" aria-hidden="true" />
                Your note
              </p>
              <p className="mt-0.5 line-clamp-2 whitespace-pre-line break-words text-xs leading-relaxed text-foreground/90">
                {savedNote}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-11 min-w-11 shrink-0 lg:min-h-8"
              onClick={(event) => openEditor(event.currentTarget)}
              aria-label={`Edit saved note for ${problemTitle}`}
            >
              <Pencil aria-hidden="true" />
              <span className="hidden sm:inline">Edit note</span>
            </Button>
          </div>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this note?"
        description="The note will be removed from this problem. This cannot be undone."
        confirmLabel="Delete note"
        pending={pending === "delete"}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
