import Link from "next/link";
import { CalendarClock, CheckCircle2, Flame } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ProblemTags } from "@/components/problems/problem-tags";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DailyChallenge as DailyChallengeData } from "@/server/services/daily-challenge";
import { cn } from "@/lib/utils";

export function DailyChallenge({
  data,
  className,
}: {
  data: DailyChallengeData;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8", className)}>
      <Card className="overflow-hidden border-primary/25 bg-gradient-to-r from-primary/5 via-transparent to-amber-500/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-3">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarClock className="size-4 text-primary" /> Daily challenge
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="size-3.5 text-amber-500" />
            {data.streak} day{data.streak === 1 ? "" : "s"} streak
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-5 px-5 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={data.problem.difficulty} />
              <span className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs">
                {data.problem.points} points
              </span>
              {data.solvedToday ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Solved today
                </span>
              ) : null}
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              <Link
                href={`/problems/${data.problem.slug}`}
                className="hover:text-primary"
              >
                {data.problem.title}
              </Link>
            </h2>
            <ProblemTags tags={data.problem.tags} limit={4} className="mt-2" />
          </div>
          <Link
            href={`/problems/${data.problem.slug}`}
            className={buttonVariants()}
          >
            {data.solvedToday ? "Review today's problem" : "Solve today's problem"}
          </Link>
        </div>
      </Card>
    </section>
  );
}
