import {
  getNextRatingTier,
  getRatingRunwayPercent,
  RATING_TIERS,
} from "@/lib/rating-tiers";

export function RatingCardFooter({
  currentRating,
  activeBand,
}: {
  currentRating: number;
  activeBand: string;
}) {
  const nextTier = getNextRatingTier(currentRating);
  const pointsToNext = nextTier ? nextTier.min - currentRating : null;
  const runwayPercent = getRatingRunwayPercent(currentRating);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/70 px-5 py-2.5">
      <div className="flex min-w-[240px] flex-1 items-center gap-3">
        <span className="shrink-0 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Tier runway
        </span>
        <div
          className="relative h-1.5 min-w-0 flex-1 rounded-full bg-muted"
          role="progressbar"
          aria-label={
            nextTier
              ? `${pointsToNext} points to ${nextTier.label}`
              : "Top tier reached"
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(runwayPercent)}
        >
          <div
            className="animate-bar h-full rounded-full bg-primary/60"
            style={{ width: `${runwayPercent}%` }}
          />
          {RATING_TIERS.filter((marker) => marker.min >= 1500).map(
            (marker) => (
              <span
                key={marker.key}
                className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-border"
                style={{
                  left: `${getRatingRunwayPercent(marker.min)}%`,
                }}
                aria-hidden="true"
              />
            ),
          )}
          <span
            className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary shadow-sm"
            style={{ left: `${runwayPercent}%` }}
            aria-hidden="true"
          />
        </div>
        <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
          {nextTier ? (
            <>
              <span className="text-foreground">{nextTier.label}</span> in{" "}
              {pointsToNext} pts
            </>
          ) : (
            "Top tier reached"
          )}
        </span>
      </div>

      <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] text-muted-foreground">
        Your band
        <span className="inline-flex items-center gap-1 font-mono font-medium tabular-nums text-amber-600 dark:text-amber-400">
          <span
            className="size-1.5 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          {activeBand}
        </span>
      </span>
    </div>
  );
}
