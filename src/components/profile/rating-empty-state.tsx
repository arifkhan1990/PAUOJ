import Link from "next/link";
import { Trophy } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RATING_TIERS } from "@/lib/rating-tiers";
import { cn } from "@/lib/utils";

export function RatingEmptyState() {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Trophy className="size-4" />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Contest trajectory
            </p>
            <h2 className="mt-0.5 text-sm font-semibold">
              Your rating starts at 1500
            </h2>
          </div>
        </div>
        <span className="rounded-full border border-dashed border-border bg-muted/30 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Unrated
        </span>
      </div>

      <div
        className="relative mt-5 h-44 overflow-hidden rounded-xl border border-border bg-muted/15"
        role="img"
        aria-label="Preview of a rising rating chart from 1500 through the tier ladder"
      >
        <div
          className="grid-pattern pointer-events-none absolute inset-0 opacity-25"
          aria-hidden="true"
        />
        <span className="absolute left-4 top-4 rounded-full border border-border bg-card/85 px-2 py-0.5 font-mono text-[9px] text-muted-foreground backdrop-blur-sm">
          start 1500
        </span>
        <svg
          viewBox="0 0 400 150"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ghost-rating-fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--primary)"
                stopOpacity={0.2}
              />
              <stop
                offset="100%"
                stopColor="var(--primary)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <path
            d="M0 122 C 58 122 88 98 136 102 S 235 64 286 70 S 355 30 400 20 L400 150 L0 150Z"
            fill="url(#ghost-rating-fill)"
          />
          <path
            d="M0 122 C 58 122 88 98 136 102 S 235 64 286 70 S 355 30 400 20"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeDasharray="6 7"
            strokeLinecap="round"
            className="animate-dash"
          />
        </svg>
        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-1">
          {RATING_TIERS.filter((tier) => tier.min >= 1500).map((tier) => (
            <span
              key={tier.key}
              className={cn(
                "rounded-sm px-1 py-0.5 text-[8px] font-medium sm:text-[9px]",
                tier.textClassName,
              )}
            >
              {tier.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          One rated contest starts the graph.
        </p>
        <Link
          href="/contests"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "self-start",
          )}
        >
          Explore contests
        </Link>
      </div>
    </Card>
  );
}
