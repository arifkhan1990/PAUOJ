import Link from "next/link";
import { Trophy } from "lucide-react";
import { DashboardPanel } from "@/components/dashboard/dashboard-panel";
import { Countdown } from "@/components/shared/countdown";
import { EmptyState } from "@/components/shared/empty-state";
import type { ContestListItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function UpcomingContestsCard({
  contests,
}: {
  contests: ContestListItem[];
}) {
  return (
    <DashboardPanel
      title="Upcoming contests"
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
          {contests.map((contest) => (
            <li key={contest.id} className="py-2.5">
              <Link
                href={`/contests/${contest.slug}`}
                className="block truncate text-[13px] font-medium hover:text-primary"
              >
                {contest.title}
              </Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                <span>
                  {formatDate(contest.startAt)} · {contest.problemCount}{" "}
                  problems
                </span>
                <span aria-hidden="true" className="text-border">
                  ·
                </span>
                <Countdown
                  className="text-[10px]"
                  target={contest.startAt}
                  label="Starts"
                />
              </p>
              {contest.registered ? (
                <p className="mt-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                  You are registered
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
