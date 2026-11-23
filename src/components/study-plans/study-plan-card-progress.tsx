import { studyProgressPercent } from "@/lib/study-list";
import { cn } from "@/lib/utils";

/** A segmented meter reads faster than a donut on small catalog cards. */
const MAX_SEGMENTS = 10;

/**
 * Segmented study-plan progress for catalog cards.
 *
 * The meter shows one segment per problem for short plans and ten
 * proportional segments for longer ones. It deliberately avoids an SVG ring:
 * a thin segmented bar stays legible at card size and keeps the card compact.
 */
export function StudyPlanCardProgress({
  solved,
  total,
  signedIn,
  className,
}: {
  solved: number;
  total: number;
  signedIn: boolean;
  className?: string;
}) {
  const safeTotal = Math.max(0, total);
  const safeSolved = Math.min(Math.max(0, solved), safeTotal);
  const segmentCount = Math.min(MAX_SEGMENTS, Math.max(1, safeTotal));
  const percent = studyProgressPercent(safeSolved, safeTotal);
  const completed = signedIn && safeTotal > 0 && safeSolved >= safeTotal;

  const proportional =
    safeTotal > 0 ? Math.round((safeSolved / safeTotal) * segmentCount) : 0;
  const rawFilled =
    safeTotal <= MAX_SEGMENTS
      ? Math.min(safeSolved, segmentCount)
      : proportional;
  const filled = !signedIn || safeSolved === 0
    ? 0
    : completed
      ? segmentCount
      : Math.min(segmentCount - 1, Math.max(1, rawFilled));

  const label = !signedIn
    ? "Sign in to track progress"
    : completed
      ? "Completed"
      : safeSolved === 0
        ? "Not started"
        : `${safeSolved} of ${safeTotal} solved`;

  const ariaLabel = signedIn
    ? `${safeSolved} of ${safeTotal} problems solved`
    : "Sign in to track progress";
  const ariaValueText = completed
    ? `Completed, ${safeSolved} of ${safeTotal} problems solved`
    : ariaLabel;
  const showPercent = signedIn && safeSolved > 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] font-medium text-muted-foreground">
          {label}
        </p>
        {showPercent ? (
          <span className="shrink-0 font-mono text-[11px] font-medium tabular-nums text-foreground/80">
            {percent}%
          </span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuenow={signedIn ? safeSolved : 0}
        aria-valuetext={ariaValueText}
        className="flex items-center gap-1.5"
      >
        {Array.from({ length: segmentCount }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={cn(
              "h-2 flex-1 rounded-full transition-colors motion-reduce:transition-none",
              index < filled
                ? completed
                  ? "bg-success"
                  : "bg-primary"
                : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
