import { cn } from "@/lib/utils";

/**
 * Circular lesson progress. Server-rendered SVG keeps the ring available
 * without chart hydration or a chart dependency.
 */
export function LessonProgressDonut({
  solved,
  total,
  percent,
  className,
}: {
  solved: number;
  total: number;
  percent: number;
  className?: string;
}) {
  const value = Math.min(100, Math.max(0, percent));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;

  return (
    <div className={cn("flex shrink-0 items-center gap-3", className)}>
      <div className="relative size-14 sm:size-16">
        <svg
          viewBox="0 0 64 64"
          className="size-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="6"
            className="stroke-muted"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference - filled}`}
            className={cn(
              "transition-[stroke-dasharray] duration-500 motion-reduce:transition-none",
              value >= 100 ? "stroke-emerald-500" : "stroke-primary",
            )}
          />
        </svg>
        <span
          className="absolute inset-0 grid place-items-center font-mono text-[11px] font-semibold tabular-nums sm:text-xs"
          aria-hidden="true"
        >
          {Math.round(value)}%
        </span>
      </div>
      <div className="hidden sm:block">
        <p className="text-sm font-semibold tabular-nums">
          <span className="sr-only">Lesson progress: </span>
          {solved}/{total}
        </p>
        <p className="text-[11px] leading-tight text-muted-foreground">solved</p>
      </div>
    </div>
  );
}
