import { cn, formatPercent } from "@/lib/utils";

/** Progress bar with an explicit solved/total label and a muted guest state. */
export function StudyProgress({
  solved,
  total,
  percent,
  muted = false,
  label,
  className,
}: {
  solved: number;
  total: number;
  percent: number;
  muted?: boolean;
  label?: string;
  className?: string;
}) {
  const value = Math.min(100, Math.max(0, percent));
  const ariaLabel = label ?? `${solved} of ${total} problems solved`;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-[11px]">
        <span className="min-w-0 truncate text-muted-foreground">
          {muted ? "Sign in to track progress" : `${solved} of ${total} solved`}
        </span>
        {muted ? null : (
          <span className="shrink-0 font-mono font-medium tabular-nums text-foreground/80">
            {formatPercent(value, 0)}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        aria-valuetext={`${solved} of ${total} problems solved`}
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/60"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
            muted ? "bg-muted-foreground/30" : "bg-primary",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
