import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LearningSection({
  step,
  title,
  count,
  description,
  id,
  isLast = false,
  children,
  className,
}: {
  step: number;
  title: string;
  count?: number;
  description?: string;
  id?: string;
  isLast?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `learning-section-${id ?? step}`;
  const number = String(step).padStart(2, "0");

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-24 pb-8 sm:pb-10 lg:scroll-mt-52",
        isLast && "pb-0 sm:pb-0",
        className,
      )}
    >
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[2.25rem_minmax(0,1fr)] sm:gap-x-4">
        <div className="flex flex-col items-center" aria-hidden="true">
          <span className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 font-mono text-[11px] font-semibold text-primary sm:size-8">
            {number}
          </span>
          {isLast ? null : (
            <span className="-mb-8 mt-2 w-px flex-1 rounded-full bg-gradient-to-b from-border via-border to-transparent sm:-mb-10" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2
              id={headingId}
              className="text-lg font-semibold tracking-tight sm:text-xl"
            >
              <span className="sr-only">Step {step}: </span>
              {title}
            </h2>
            {typeof count === "number" ? (
              <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10.5px] font-medium text-muted-foreground">
                {count} {count === 1 ? "problem" : "problems"}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          <div className="mt-3 sm:mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
