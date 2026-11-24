import { Eye, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { LessonVisualConfig } from "@/lib/learning/visual-types";
import { cn } from "@/lib/utils";

/**
 * Shared shell for every lesson visual. The animated stage is decorative; the
 * ordered steps below it are the accessible equivalent, so screen-reader and
 * reduced-motion users get the same teaching sequence.
 */
export function VisualFrame({
  config,
  children,
  compact = false,
  className,
}: {
  config: LessonVisualConfig;
  children: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <figure
      data-visual-kind={config.kind}
      className={cn(
        "not-prose overflow-hidden rounded-xl border border-border bg-card shadow-xs",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-1.5 border-b border-border bg-muted/25",
          compact ? "px-4 py-3" : "px-4 py-4 sm:px-5",
        )}
      >
        <p className="flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-primary">
          <Eye className="size-3.5" aria-hidden="true" />
          Concept visual
          <Sparkles className="size-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </p>
        <h3 className="text-sm font-semibold leading-snug sm:text-base">
          {config.title}
        </h3>
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
          {config.caption}
        </p>
      </div>

      <div
        aria-hidden="true"
        className={cn(
          "relative overflow-hidden bg-background/60",
          compact ? "min-h-40 px-3 py-4 sm:px-5" : "min-h-52 px-4 py-5 sm:px-6 sm:py-6",
        )}
      >
        {children}
      </div>

      <ol
        className={cn(
          "divide-y divide-border/60 border-t border-border bg-card",
          compact ? "text-[11px]" : "text-xs",
        )}
      >
        {(compact ? config.steps.slice(0, 3) : config.steps).map((step, index) => (
          <li
            key={`${step.label}-${index}`}
            className={cn(
              "flex items-start gap-2.5",
              compact ? "px-4 py-2" : "px-4 py-2.5 sm:px-5",
            )}
          >
            <span
              aria-hidden="true"
              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-[11px] font-semibold text-foreground"
            >
              {index + 1}
            </span>
            <span className="min-w-0 leading-snug">
              <span className="font-medium text-foreground">{step.label}</span>
              {step.note && !compact ? (
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  {step.note}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/15 px-4 py-2 text-xs text-muted-foreground sm:px-5">
        <span>
          {compact
            ? `${Math.min(3, config.steps.length)}টি ধাপের ঝলক`
            : `${config.steps.length}টি ধাপে দেখা হচ্ছে`}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary/60 animate-pulse-soft" />
          গতি কমালে স্থির
        </span>
      </figcaption>
    </figure>
  );
}
