import { getRatingTier } from "@/lib/rating-tiers";
import { cn } from "@/lib/utils";

/** Tier pill for a live rating; colour never carries the meaning alone. */
export function RatingTierBadge({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  const tier = getRatingTier(rating);
  return (
    <span
      title={`${tier.label} tier`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tier.badgeClassName,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", tier.barClassName)}
      />
      {tier.label}
    </span>
  );
}
