import Link from "next/link";
import { Medal, Trophy } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { RatingHistoryItem } from "@/lib/rating-types";
import { cn, formatDate } from "@/lib/utils";

export function ContestHistory({
  history,
}: {
  history: RatingHistoryItem[];
}) {
  const recent = history.slice(-5).reverse();
  const bestRank =
    history.length > 0
      ? history.reduce((best, item) => Math.min(best, item.rank), Infinity)
      : null;

  return (
    <DashboardPanel
      title="Contest history"
      description="Rank and rating change from your latest rounds."
      icon={<Trophy className="size-4" />}
      action={
        <Link
          href="/contests"
          className="text-[11px] font-medium text-primary hover:underline"
        >
          All contests
        </Link>
      }
      bodyClassName="px-4 pb-2 pt-1"
    >
      {recent.length === 0 ? (
        <EmptyState
          className="border-0 px-0 py-8"
          title="No rated contests yet"
          description="Join a contest to start your rating history."
          icon={Trophy}
          action={
            <Link href="/contests" className={buttonVariants({ size: "sm" })}>
              Find a contest
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border">
          {recent.map((contest) => {
            const isBest = contest.rank === bestRank;
            return (
              <li key={`${contest.contestSlug}-${contest.createdAt}`}>
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/contests/${contest.contestSlug}`}
                      className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium hover:text-primary"
                    >
                      {isBest ? (
                        <Medal
                          className="size-3.5 shrink-0 text-amber-500"
                          aria-label="Your best contest finish"
                        />
                      ) : null}
                      <span className="truncate">{contest.contestTitle}</span>
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(contest.createdAt)} · Rank #{contest.rank}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden font-mono text-[11px] text-muted-foreground tabular-nums sm:inline">
                      {contest.newRating}
                    </span>
                    <span
                      className={cn(
                        "min-w-12 rounded-md border px-1.5 py-0.5 text-center font-mono text-[11px] font-medium tabular-nums",
                        contest.delta >= 0
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300",
                      )}
                    >
                      {contest.delta >= 0 ? "+" : ""}
                      {contest.delta}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
