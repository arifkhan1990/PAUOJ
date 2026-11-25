import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Crown,
  Trophy,
  Users,
} from "lucide-react";
import { ContestCountdown } from "@/components/home/contest-countdown";
import { ContestStatusBadge } from "@/components/contests/contest-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionHeading } from "@/components/shared/section-heading";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { CONTEST_STATUS_META, contestDurationMs } from "@/lib/contests";
import type { ContestListItem, RankRow } from "@/lib/types";
import { cn, formatDateTime, formatDuration } from "@/lib/utils";

function ContestSpotlight({ contest }: { contest: ContestListItem }) {
  return (
    <article className="reveal relative overflow-hidden rounded-xl border border-border bg-background p-6">
      <div
        className="pointer-events-none absolute -right-12 -top-20 size-52 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <ContestStatusBadge status={contest.status} />
          {contest.registered ? (
            <span className="text-xs font-medium text-primary">Registered</span>
          ) : null}
        </div>

        <h3 className="mt-4 text-xl font-semibold tracking-tight">
          <Link
            href={`/contests/${contest.slug}`}
            className="transition-colors hover:text-primary"
          >
            {contest.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {contest.description}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <CalendarDays className="size-3" /> Starts
            </p>
            <p className="mt-1 text-xs font-medium">
              {formatDateTime(contest.startAt)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <Clock3 className="size-3" /> Duration
            </p>
            <p className="mt-1 text-xs font-medium">
              {formatDuration(
                contestDurationMs(contest.startAt, contest.endAt),
              )}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              <Users className="size-3" /> Registered
            </p>
            <p className="mt-1 text-xs font-medium">
              {contest.participantCount} coder
              {contest.participantCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-4 py-3">
          <ContestCountdown
            startAt={contest.startAt}
            endAt={contest.endAt}
          />
          <Link
            href={`/contests/${contest.slug}`}
            className={cn(buttonVariants({ size: "sm" }), "group")}
          >
            Open contest
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ContestRow({ contest }: { contest: ContestListItem }) {
  return (
    <Link
      href={`/contests/${contest.slug}`}
      className="reveal group flex items-center gap-3 rounded-lg border border-border bg-background/60 px-4 py-3 transition hover:border-primary/40 hover:bg-background"
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          CONTEST_STATUS_META[contest.status].dotClassName,
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
          {contest.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatDateTime(contest.startAt)} · {contest.participantCount}{" "}
          registered
        </p>
      </div>
      <ContestStatusBadge
        status={contest.status}
        className="hidden shrink-0 sm:inline-flex"
      />
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

function podiumTone(rank: number): string {
  if (rank === 1) {
    return "border-amber-400/60 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/40 dark:text-amber-200";
  }
  if (rank === 2) {
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
  }
  return "border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200";
}

function PodiumCard({ row }: { row: RankRow }) {
  const first = row.rank === 1;
  return (
    <Link
      href={`/users/${row.username}`}
      className={cn(
        "group flex flex-col items-center rounded-xl border p-3 text-center transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-4",
        first
          ? "border-amber-300/70 bg-gradient-to-b from-amber-50/80 to-card pb-6 dark:border-amber-700/50 dark:from-amber-950/20 sm:pt-6"
          : "border-border bg-card",
      )}
    >
      <span
        className={cn(
          "mb-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          podiumTone(row.rank),
        )}
      >
        {first ? <Crown className="size-3" /> : null}#{row.rank}
      </span>
      <UserAvatar
        name={row.displayName}
        username={row.username}
        size={first ? "lg" : "md"}
        avatarPreset={row.avatarPreset}
        avatarImageAt={row.avatarImageUpdatedAt}
      />
      <p className="mt-2 w-full truncate text-sm font-semibold transition-colors group-hover:text-primary">
        {row.displayName}
      </p>
      <p className="w-full truncate text-[11px] text-muted-foreground">
        @{row.username}
      </p>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="font-mono text-lg font-semibold tabular-nums">
          {row.points}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          pts
        </span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {row.solvedCount} solved
      </p>
    </Link>
  );
}

function RankLine({ row }: { row: RankRow }) {
  return (
    <Link
      href={`/users/${row.username}`}
      className="group flex items-center gap-3 py-2.5"
    >
      <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground">
        {row.rank}
      </span>
      <UserAvatar
        name={row.displayName}
        username={row.username}
        size="sm"
        avatarPreset={row.avatarPreset}
        avatarImageAt={row.avatarImageUpdatedAt}
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium transition-colors group-hover:text-primary">
        {row.displayName}
      </span>
      <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
        {row.solvedCount} solved
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">
        {row.points}
      </span>
    </Link>
  );
}

function RankPodium({ items }: { items: RankRow[] }) {
  const podium = items.slice(0, 3);
  const rest = items.slice(3);
  const ordered = [podium[1], podium[0], podium[2]].filter(
    (row): row is RankRow => Boolean(row),
  );

  return (
    <div className="reveal mt-5">
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
        {ordered.map((row) => (
          <PodiumCard key={row.username} row={row} />
        ))}
      </div>
      {rest.length > 0 ? (
        <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-background px-3">
          {rest.map((row) => (
            <RankLine key={row.username} row={row} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function CompetitionSection({
  contests,
  rankItems,
}: {
  contests: ContestListItem[];
  rankItems: RankRow[];
}) {
  const [spotlight, ...upcoming] = contests;

  return (
    <section id="contests" className="scroll-mt-20 border-y border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14">
          <div>
            <SectionHeading
              eyebrow="Contests"
              title="Compete when the clock is on"
              description="ICPC scoring, live standings and contest-only problem sets."
              href="/contests"
              linkLabel="All contests"
              size="lg"
            />
            {!spotlight ? (
              <EmptyState
                className="mt-6"
                title="No contests scheduled"
                description="Contests created by an administrator will appear here."
                icon={Trophy}
              />
            ) : (
              <div className="mt-5 space-y-3">
                <ContestSpotlight contest={spotlight} />
                {upcoming.map((contest) => (
                  <ContestRow key={contest.id} contest={contest} />
                ))}
              </div>
            )}
          </div>

          <div className="lg:border-l lg:border-border lg:pl-12 xl:pl-14">
            <SectionHeading
              eyebrow="Leaderboard"
              title="The top of the board"
              description="Points come from distinct accepted problems — solve more to climb."
              href="/rank"
              linkLabel="Full ranking"
              size="lg"
            />
            {rankItems.length === 0 ? (
              <EmptyState
                className="mt-6"
                title="No ranked coders yet"
                description="The leaderboard fills up as soon as problems are solved."
                icon={Trophy}
              />
            ) : (
              <RankPodium items={rankItems} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
