import type { RatingBucket } from "@/lib/rating-distribution";
import { cn } from "@/lib/utils";

export function RatingHistogram({
  buckets,
  ratingRank,
  ratedUserCount,
}: {
  buckets: RatingBucket[];
  ratingRank: number | null;
  ratedUserCount: number;
}) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const topPercent =
    ratingRank !== null && ratedUserCount > 0
      ? Math.max(1, Math.round((ratingRank / ratedUserCount) * 100))
      : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Rating distribution
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {ratedUserCount.toLocaleString("en-US")}{" "}
            {ratedUserCount === 1 ? "rated coder" : "rated coders"}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
            topPercent
              ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {topPercent ? `Top ${topPercent}%` : "Unranked"}
        </span>
      </div>

      <div
        className="mt-3 flex min-h-20 flex-1 items-end gap-[3px]"
        role="img"
        aria-label={`Rating distribution across ${ratedUserCount} rated coders`}
      >
        {buckets.map((bucket, index) => (
          <div
            key={bucket.label}
            className="group relative flex h-full flex-1 items-end"
            title={`${bucket.label}: ${bucket.count} ${
              bucket.count === 1 ? "coder" : "coders"
            }`}
          >
            <div
              className={cn(
                "animate-bar-y w-full rounded-[2px]",
                bucket.count === 0 && "min-h-[2px]",
                bucket.active
                  ? "bg-amber-500"
                  : "bg-muted-foreground/20 group-hover:bg-muted-foreground/35",
              )}
              style={{
                height: `${Math.max(
                  bucket.count > 0 ? 6 : 0,
                  (bucket.count / max) * 100,
                )}%`,
                animationDelay: `${index * 20}ms`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-[8px] text-muted-foreground">
        <span>{buckets[0]?.label ?? "1000"}</span>
        <span>{buckets.at(-1)?.label ?? "2400+"}</span>
      </div>
    </div>
  );
}
