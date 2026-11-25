"use client";

import { useEffect, useId, useRef } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Accessible confirmation for destructive actions. Uses the native dialog
 * element so focus trapping, Escape and the top layer come from the browser.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pendingLabel = "Deleting…",
  pending = false,
  destructive = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl backdrop:bg-black/50"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full",
            destructive
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
              : "bg-primary/10 text-primary",
          )}
          aria-hidden="true"
        >
          <TriangleAlert className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <p
            id={descriptionId}
            className="mt-1 text-sm leading-relaxed text-muted-foreground"
          >
            {description}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
          disabled={pending}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={destructive ? "destructive" : "default"}
          size="lg"
          onClick={onConfirm}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : null}
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
