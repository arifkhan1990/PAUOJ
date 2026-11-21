import Link from "next/link";
import type { ReviewerLeaderboard } from "@/lib/reviewer-leaderboard-types";
import { cn } from "@/lib/utils";

const RANGES = [
  { key: "7", label: "7 days", href: "/reviewers?range=7" },
  { key: "30", label: "30 days", href: "/reviewers?range=30" },
  { key: "all", label: "All time", href: "/reviewers" },
] as const;

export function ReviewerRangeTabs({
  active,
  className,
}: {
  active: ReviewerLeaderboard["range"];
  className?: string;
}) {
  const activeKey = String(active);

  return (
    <nav
      aria-label="Review period"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/40 p-1",
        className,
      )}
    >
      {RANGES.map((range) => {
        const isActive = range.key === activeKey;
        return (
          <Link
            key={range.key}
            href={range.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-md px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-8",
              isActive
                ? "bg-card font-medium text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {range.label}
          </Link>
        );
      })}
    </nav>
  );
}
