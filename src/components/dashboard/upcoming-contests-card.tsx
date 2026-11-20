import Link from "next/link";
import { Trophy } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { Countdown } from "@/components/shared/countdown";
import { EmptyState } from "@/components/shared/empty-state";
import { CONTEST_STATUS_META } from "@/lib/contests";
import type { ContestListItem } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export function UpcomingContestsCard({
  contests,
}: {
  contests: ContestListItem[];
}) {
  return (
    <DashboardPanel
      title="Upcoming contests"
      description="Register early and block the time."
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
      {contests.length === 0 ? (
        <EmptyState
          className="border-0 px-0 py-6"
          title="No upcoming contests"
          description="New rounds will be announced on the contest page."
          icon={Trophy}
        />
      ) : (
        <ul className="divide-y divide-border">
          {contests.map((contest) => {
            const status = CONTEST_STATUS_META[contest.status];
            return (
              <li key={contest.id}>
                <div className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/contests/${contest.slug}`}
                      className="block truncate text-[13px] font-medium hover:text-primary"
                    >
                      {contest.title}
                    </Link>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(contest.startAt)} · {contest.problemCount}{" "}
                      problems
                    </p>
                    {contest.registered ? (
                      <p className="mt-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                        You are registered
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                      status.className,
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        status.dotClassName,
                      )}
                    />
                    {status.label}
                  </span>
                </div>
                <p className="pb-2 text-[10px] text-muted-foreground">
                  <Countdown target={contest.startAt} label="Starts in" />
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardPanel>
  );
}
