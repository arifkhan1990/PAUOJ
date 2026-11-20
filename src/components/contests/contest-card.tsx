import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, Users } from "lucide-react";
import { ContestStatusBadge } from "./contest-status-badge";
import type { ContestListItem } from "@/lib/types";
import { CONTEST_DIVISION_LABEL, contestDurationMs } from "@/lib/contests";
import { formatDateTime, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ContestCard({
  contest,
  className,
}: {
  contest: ContestListItem;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <ContestStatusBadge status={contest.status} />
          <span className="rounded border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {CONTEST_DIVISION_LABEL[contest.division]}
          </span>
        </div>
        {contest.registered ? (
          <span className="text-xs font-medium text-primary">Registered</span>
        ) : null}
      </div>
      <h3 className="mt-3 text-base font-semibold">
        <Link href={`/contests/${contest.slug}`} className="hover:text-primary">
          {contest.title}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {contest.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          {formatDateTime(contest.startAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          {formatDuration(contestDurationMs(contest.startAt, contest.endAt))}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5" />
          {contest.participantCount} registered
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted-foreground">
          {contest.problemCount} problem{contest.problemCount === 1 ? "" : "s"}
        </span>
        <Link
          href={`/contests/${contest.slug}`}
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Open contest <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
