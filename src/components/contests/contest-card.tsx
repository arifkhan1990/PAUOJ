import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/shared/countdown";
import { CONTEST_SPONSOR_TIER_LABEL } from "@/lib/contest-ops";
import { CONTEST_DIVISION_LABEL, contestDurationMs } from "@/lib/contests";
import type { ContestListItem } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";
import { ContestDateBlock } from "./contest-date-block";
import { contestTeamSizeLabel } from "./contest-format-badge";

type MetaItem = { key: string; value: string };

export function ContestCard({
  contest,
  className,
}: {
  contest: ContestListItem;
  className?: string;
}) {
  const format = contest.format ?? "SINGLE";
  const sponsor = contest.sponsor ?? null;
  const official = Boolean(contest.isOfficial);
  const monthly = official && Boolean(contest.seriesId);
  const isLive = contest.status === "RUNNING";
  const ended = contest.status === "ENDED";
  const registered = contest.registered && !ended;

  const meta: MetaItem[] = [
    {
      key: "format",
      value:
        format === "GROUP"
          ? `Team · ${contestTeamSizeLabel(contest.teamSize).replace(" per team", "/team")}`
          : "Solo",
    },
    { key: "division", value: CONTEST_DIVISION_LABEL[contest.division] },
    {
      key: "duration",
      value: formatDuration(contestDurationMs(contest.startAt, contest.endAt)),
    },
    {
      key: "participants",
      value: `${contest.participantCount} registered`,
    },
    ...(contest.problemCount > 0
      ? [
          {
            key: "problems",
            value: `${contest.problemCount} problem${contest.problemCount === 1 ? "" : "s"}`,
          },
        ]
      : []),
    ...(sponsor
      ? [
          {
            key: "sponsor",
            value: `${sponsor.name} (${CONTEST_SPONSOR_TIER_LABEL[sponsor.tier]})`,
          },
        ]
      : []),
  ];

  return (
    <article
      className={cn(
        "group relative flex flex-col motion-safe:transition-colors",
        "hover:bg-muted/30 focus-within:bg-muted/20",
        isLive && "border-l-2 border-l-emerald-500",
        "sm:grid sm:grid-cols-[6.5rem_minmax(0,1fr)_12rem] sm:gap-5 sm:px-5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center px-4 pt-4 sm:block sm:border-r sm:border-border sm:px-0 sm:py-5 sm:pr-4">
        <ContestDateBlock startAt={contest.startAt} status={contest.status} />
      </div>

      <div className="min-w-0 px-4 pb-1 pt-2 sm:px-0 sm:py-5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <h3
            className={cn(
              "min-w-0 break-words text-base font-semibold leading-snug",
              ended && "text-muted-foreground",
            )}
          >
            <Link
              href={`/contests/${contest.slug}`}
              className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {contest.title}
            </Link>
          </h3>
          {official ? (
            <Badge
              variant="outline"
              className="gap-1 border-primary/30 bg-primary/5 px-1.5 py-0 text-[10px] font-semibold text-primary"
            >
              <BadgeCheck className="size-3" aria-hidden="true" />
              {monthly ? "Monthly official" : "Official"}
            </Badge>
          ) : null}
          {registered ? (
            <Badge
              variant="success"
              className="gap-1 px-1.5 py-0 text-[10px] font-semibold"
            >
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Registered
            </Badge>
          ) : null}
        </div>

        <ul className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          {meta.map((item, index) => (
            <li
              key={item.key}
              className="flex min-w-0 max-w-full items-center gap-1.5"
            >
              {index > 0 ? (
                <span aria-hidden="true" className="text-muted-foreground/60">
                  ·
                </span>
              ) : null}
              <span className="min-w-0 truncate">{item.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 pb-3 pt-2 sm:flex-col sm:items-end sm:justify-center sm:gap-1 sm:border-t-0 sm:px-0 sm:py-5">
        {ended ? (
          <Link
            href={`/contests/${contest.slug}/standings`}
            aria-label={`Results: ${contest.title}`}
            className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <Trophy className="size-3.5" aria-hidden="true" />
            Results
            <ArrowRight
              className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ) : (
          <>
            <Countdown
              target={isLive ? contest.endAt : contest.startAt}
              label={isLive ? "Ends in" : "Starts in"}
              className="whitespace-nowrap text-[11px] text-muted-foreground"
            />
            <Link
              href={`/contests/${contest.slug}`}
              aria-label={`${isLive ? "Enter round" : "View contest"}: ${contest.title}`}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              {isLive ? "Enter round" : "View contest"}
              <ArrowRight
                className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
