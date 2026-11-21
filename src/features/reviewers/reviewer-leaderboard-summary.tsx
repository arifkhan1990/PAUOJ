import { Clock, ListChecks, Users, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ReviewerLeaderboard } from "@/lib/reviewer-leaderboard-types";
import {
  formatReviewCount,
  formatReviewHours,
} from "@/features/reviewers/reviewer-leaderboard-meta";

export function ReviewerLeaderboardSummary({
  board,
}: {
  board: ReviewerLeaderboard;
}) {
  const stats: {
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
  }[] = [
    {
      label: "Total decisions",
      value: formatReviewCount(board.totalDecisions),
      hint: "approved or rejected",
      icon: ListChecks,
    },
    {
      label: "Reviewers",
      value: formatReviewCount(board.totalReviewers),
      hint: "reviewers",
      icon: Users,
    },
    {
      label: "Average review time",
      value: formatReviewHours(board.averageReviewHours),
      hint: "per decision",
      icon: Clock,
    },
  ];

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="flex items-center gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-semibold leading-tight tabular-nums">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stat.label}
                <span className="hidden sm:inline"> · {stat.hint}</span>
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
