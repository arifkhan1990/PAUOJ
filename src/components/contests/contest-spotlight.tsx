import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Countdown } from "@/components/shared/countdown";
import { ContestBannerMedia } from "./contest-banner";
import { ContestFormatBadge } from "./contest-format-badge";
import { ContestStatusBadge } from "./contest-status-badge";
import {
  CONTEST_SPONSOR_TIER_CLASS,
  CONTEST_SPONSOR_TIER_LABEL,
} from "@/lib/contest-ops";
import { CONTEST_DIVISION_LABEL, contestDurationMs } from "@/lib/contests";
import { plainContestText } from "@/lib/contest-text";
import type { ContestListItem } from "@/lib/types";
import {
  cn,
  formatDhakaDateTime,
  formatDhakaDateTimeShort,
  formatDuration,
} from "@/lib/utils";

const countFormatter = new Intl.NumberFormat("en-US");

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

/** "30 Nov 2026, 22:00" -> date + wall-clock, so the time can use mono. */
function splitDhakaDateTime(value: string): { date: string; time: string | null } {
  const [date, time] = formatDhakaDateTimeShort(value).split(", ");
  return { date: date ?? "", time: time ?? null };
}

function MetaItem({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
      </dt>
      <dd className="mt-1 min-w-0 text-sm font-medium text-foreground">
        {children}
      </dd>
    </div>
  );
}

export function ContestSpotlight({
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
  const isEnded = contest.status === "ENDED";
  const description = plainContestText(contest.description);
  const start = splitDhakaDateTime(contest.startAt);
  const titleId = `contest-spotlight-title-${contest.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs",
        isLive && "border-emerald-500/40 ring-1 ring-emerald-500/25",
        className,
      )}
    >
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative aspect-[16/9] max-h-72 w-full overflow-hidden border-b border-border bg-muted sm:max-h-80 lg:aspect-auto lg:min-h-72 lg:border-b-0 lg:border-r">
          <ContestBannerMedia
            bannerUrl={contest.bannerUrl ?? null}
            title={contest.title}
          />
        </div>

        <div className="flex min-w-0 flex-col p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-1.5">
            <ContestStatusBadge status={contest.status} />
            <ContestFormatBadge
              format={format}
              teamSize={contest.teamSize}
              showTeamSize={false}
            />
            <Badge variant="outline" className="bg-muted/40 text-muted-foreground">
              {CONTEST_DIVISION_LABEL[contest.division]}
            </Badge>
            {official ? (
              <Badge
                variant="outline"
                className="gap-1 border-primary/30 bg-primary/5 text-primary"
              >
                <BadgeCheck className="size-3" aria-hidden="true" />
                {monthly ? "Monthly official" : "Official"}
              </Badge>
            ) : null}
            {contest.registered ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="size-3" aria-hidden="true" />
                Registered
              </Badge>
            ) : null}
          </div>

          <h3
            id={titleId}
            className="mt-4 break-words text-2xl font-semibold leading-snug tracking-tight sm:text-3xl"
          >
            <Link href={`/contests/${contest.slug}`} className={cn("rounded-sm hover:text-primary", focusRing)}>
              {contest.title}
            </Link>
          </h3>

          <p className="mt-3 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground">
            {description || "Open the contest page for the full brief."}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 sm:gap-x-5 lg:grid-cols-2 xl:grid-cols-4">
            <MetaItem icon={CalendarDays} label="Starts">
              <span className="flex min-w-0 items-baseline gap-1 sm:gap-1.5">
                <time
                  dateTime={contest.startAt}
                  title={formatDhakaDateTime(contest.startAt)}
                  className="truncate"
                >
                  {start.date}
                </time>
                {start.time ? (
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {start.time}
                  </span>
                ) : null}
              </span>
            </MetaItem>
            <MetaItem icon={Clock3} label="Duration">
              <span className="font-mono text-xs tabular-nums sm:text-sm">
                {formatDuration(contestDurationMs(contest.startAt, contest.endAt))}
              </span>
            </MetaItem>
            <MetaItem icon={Users} label="Participants">
              <span className="font-mono tabular-nums">
                {countFormatter.format(contest.participantCount)}
              </span>
            </MetaItem>
            <MetaItem icon={ListChecks} label="Problems">
              <span className="font-mono tabular-nums">
                {contest.problemCount > 0
                  ? countFormatter.format(contest.problemCount)
                  : "TBA"}
              </span>
            </MetaItem>
          </dl>

          {sponsor ? (
            <p className="mt-4 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                Presented by
              </span>
              <span className="min-w-0 truncate font-semibold text-foreground">
                {sponsor.name}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  CONTEST_SPONSOR_TIER_CLASS[sponsor.tier],
                )}
              >
                {CONTEST_SPONSOR_TIER_LABEL[sponsor.tier]}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div
          className={cn(
            "inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-2 rounded-lg border px-3 py-2 text-xs font-medium [&>span]:text-base [&>span]:font-semibold sm:[&>span]:text-lg",
            isLive
              ? "border-emerald-500/35 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-100"
              : "border-border bg-muted/60 text-foreground",
          )}
        >
          {isEnded ? (
            <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <CalendarCheck2
                className="size-3.5 shrink-0 self-center text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Ended
              </span>
              <time
                dateTime={contest.endAt}
                title={formatDhakaDateTime(contest.endAt)}
                className="font-mono tabular-nums"
              >
                {formatDhakaDateTimeShort(contest.endAt)}
              </time>
            </span>
          ) : (
            <Countdown
              target={isLive ? contest.endAt : contest.startAt}
              label={isLive ? "Ends in" : "Starts in"}
              className="min-w-0"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={`/contests/${contest.slug}`}
            aria-label={`${isLive ? "Enter round" : "View contest"}: ${contest.title}`}
            className={cn(buttonVariants({ size: "lg" }), "h-11")}
          >
            {isLive ? "Enter round" : "View contest"}
            {isLive ? (
              <ArrowRight className="size-4" aria-hidden="true" />
            ) : (
              <ArrowUpRight className="size-4" aria-hidden="true" />
            )}
          </Link>
          {isLive ? (
            <Link
              href={`/contests/${contest.slug}/standings`}
              className="group inline-flex min-h-11 items-center gap-1.5 rounded-sm text-sm font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <Trophy className="size-4" aria-hidden="true" />
              Standings
              <ArrowRight
                className="size-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
