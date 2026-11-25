import Link from "next/link";
import { Trophy } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Card } from "@/components/ui/card";
import type { ReviewerLeaderboardRow } from "@/lib/reviewer-leaderboard-types";
import {
  ReviewerRoleBadge,
  formatReviewCount,
  formatReviewHours,
} from "@/features/reviewers/reviewer-leaderboard-meta";
import { cn, formatPercent } from "@/lib/utils";

const podiumStyles = [
  "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30",
  "border-slate-300 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40",
  "border-orange-300 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/30",
];

const medalStyles = [
  "text-amber-500",
  "text-slate-500",
  "text-orange-600",
];

export function ReviewerLeaderboardPodium({
  rows,
  className,
}: {
  rows: ReviewerLeaderboardRow[];
  className?: string;
}) {
  return (
    <section aria-label="Top reviewers" className={cn(className)}>
      <div className="grid gap-3 sm:grid-cols-3">
        {rows.slice(0, 3).map((row, index) => (
          <Card key={row.username} className={cn("p-5", podiumStyles[index])}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rank #{index + 1}
              </span>
              <Trophy className={cn("size-4", medalStyles[index])} />
            </div>
            <Link
              href={`/users/${row.username}`}
              className="mt-3 flex items-center gap-3 hover:text-primary"
            >
              <UserAvatar
                name={row.displayName}
                username={row.username}
                size="lg"
                avatarPreset={row.avatarPreset}
                avatarImageAt={row.avatarImageUpdatedAt}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {row.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{row.username}
                </p>
                <div className="mt-1">
                  <ReviewerRoleBadge role={row.role} />
                </div>
              </div>
            </Link>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatReviewCount(row.decisions)}
                </p>
                <p className="text-[11px] text-muted-foreground">decisions</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>{formatPercent(row.approvalRate)} approved</p>
                <p className="tabular-nums">
                  {formatReviewHours(row.averageReviewHours)} avg
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
