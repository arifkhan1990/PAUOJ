import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function LearningSection({
  step,
  title,
  count,
  description,
  children,
  className,
}: {
  step: number;
  title: string;
  count?: number;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `learning-section-${step}`;

  return (
    <section aria-labelledby={headingId} className={cn("scroll-mt-24", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span
          className="grid size-6 place-items-center rounded-full bg-primary/10 font-mono text-[11px] font-semibold text-primary"
          aria-hidden="true"
        >
          {String(step).padStart(2, "0")}
        </span>
        <h2
          id={headingId}
          className="text-lg font-semibold tracking-tight"
        >
          {title}
        </h2>
        {typeof count === "number" ? (
          <span className="font-mono text-[11px] text-muted-foreground">
            {count} {count === 1 ? "problem" : "problems"}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}
