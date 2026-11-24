"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accessible form modal on the native dialog element. The browser supplies the
 * top layer, focus trap, Escape handling and focus return to the trigger.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  closeDisabled = false,
  initialFocusRef,
  children,
  className,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  /** Blocks Escape, the backdrop and the close button while a request runs. */
  closeDisabled?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      const target = initialFocusRef?.current;
      if (target) requestAnimationFrame(() => target.focus());
    }
    if (!open && dialog.open) dialog.close();
  }, [open, initialFocusRef]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl backdrop:bg-black/50",
        className,
      )}
      onCancel={(event) => {
        event.preventDefault();
        if (!closeDisabled) onClose();
      }}
      onClick={(event) => {
        if (closeDisabled || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        if (outside) onClose();
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          {description ? (
            <p
              id={descriptionId}
              className="mt-1 text-sm leading-relaxed text-muted-foreground"
            >
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={closeDisabled}
          aria-label="Close dialog"
          className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}
