import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { DailyChallenge } from "@/server/services/daily-challenge";
import { cn, formatDate } from "@/lib/utils";

export function DailyChallengeCard({
  challenge,
}: {
  challenge: DailyChallenge | null;
}) {
  const streak = challenge?.streak ?? 0;

  return (
    <DashboardPanel
      title="Daily challenge"
      icon={<CalendarDays className="size-4" />}
      action={
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium",
            streak > 0 ? "text-foreground" : "text-muted-foreground",
          )}
          title="Current daily-challenge streak"
        >
          <Flame
            className={cn(
              "size-3",
              streak > 0 ? "text-orange-500" : "text-muted-foreground/60",
            )}
            aria-hidden="true"
          />
          {streak}d streak
        </span>
      }
    >
      {challenge ? (
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <DifficultyBadge difficulty={challenge.problem.difficulty} />
              {challenge.solvedToday ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  Solved
                </span>
              ) : null}
            </div>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {formatDate(challenge.date)}
            </span>
          </div>

          <div>
            <h3 className="text-[15px] font-semibold leading-snug">
              {challenge.problem.title}
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {challenge.problem.points} points
            </p>
          </div>

          {challenge.problem.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {challenge.problem.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag.slug}
                  className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}

          <Link
            href={`/problems/${challenge.problem.slug}`}
            className={cn(
              buttonVariants({
                variant: challenge.solvedToday ? "outline" : "default",
                size: "sm",
              }),
              "mt-auto w-full",
            )}
          >
            {challenge.solvedToday ? "Review problem" : "Solve challenge"}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <EmptyState
          className="border-0 px-0 py-6"
          title="No challenge today"
          description="A public problem will appear here when one is available."
        />
      )}
    </DashboardPanel>
  );
}
