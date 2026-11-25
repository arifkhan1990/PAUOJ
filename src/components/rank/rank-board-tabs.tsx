import Link from "next/link";
import type { RankBoard } from "@/lib/rating-rank";
import { cn } from "@/lib/utils";

const TABS: readonly { board: RankBoard; label: string }[] = [
  { board: "points", label: "Points" },
  { board: "rating", label: "Contest rating" },
];

/**
 * Board switch built from real links so it works without JavaScript and each
 * board keeps its own URL. These are navigation links, not ARIA tabs.
 */
export function RankBoardTabs({
  active,
  pointsHref,
  ratingHref,
  className,
}: {
  active: RankBoard;
  pointsHref: string;
  ratingHref: string;
  className?: string;
}) {
  const hrefs: Record<RankBoard, string> = { points: pointsHref, rating: ratingHref };

  return (
    <nav aria-label="Leaderboard boards" className={cn("mt-6", className)}>
      <ul className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {TABS.map((tab) => {
          const current = tab.board === active;
          return (
            <li key={tab.board}>
              <Link
                href={hrefs[tab.board]}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-10",
                  current
                    ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                    : "text-muted-foreground hover:bg-card/70 hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
