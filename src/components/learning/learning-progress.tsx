import { cn, formatPercent } from "@/lib/utils";

export function LearningProgressBar({
  solved,
  total,
  percent,
  label,
  muted = false,
  className,
}: {
  solved: number;
  total: number;
  percent: number;
  label?: string;
  muted?: boolean;
  className?: string;
}) {
  const value = Math.min(100, Math.max(0, percent));
  const ariaLabel = label ?? `${solved} of ${total} problems solved`;
  const helper = muted
    ? "Sign in to track your progress"
    : `${solved} of ${total} solved`;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-[11px]">
        <span className="truncate text-muted-foreground">{helper}</span>
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
        className="mt-2 h-2 overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/60"
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
