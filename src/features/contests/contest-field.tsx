import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Label + control + hint/error stack for the contest request forms.
 * `aria-describedby` on the control should point at `${id}-hint` or
 * `${id}-error` (see `contestFieldDescribedBy`).
 */
export function ContestField({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[11px] font-medium text-rose-600 dark:text-rose-400"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function contestFieldDescribedBy(
  id: string,
  error?: string,
  hint?: string,
): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
