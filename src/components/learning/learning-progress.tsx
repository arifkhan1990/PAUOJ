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
  const ariaLabel =
    label ?? `${solved} of ${total} problems solved`;
  const helper = muted
    ? "Sign in to track your progress"
    : `${solved} of ${total} solved`;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-[11px]">
        <span className="truncate text-muted-foreground">{helper}</span>
        {muted ? null : (
          <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
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
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            muted ? "bg-muted-foreground/30" : "bg-primary",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
