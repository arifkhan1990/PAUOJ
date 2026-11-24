import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  ShieldAlert,
  Users,
} from "lucide-react";
import { ContestBannerMedia } from "./contest-banner";
import { ContestFormatBadge } from "./contest-format-badge";
import { ContestStatusBadge } from "./contest-status-badge";
import { Countdown } from "@/components/shared/countdown";
import { Badge } from "@/components/ui/badge";
import {
  CONTEST_STAFF_ROLE_LABEL,
  type ContestStaffRole,
  type ContestStaffStatus,
} from "@/lib/contest-ops";
import type { ContestDetail } from "@/lib/types";
import { CONTEST_DIVISION_LABEL, contestDurationMs } from "@/lib/contests";
import { formatDateTime, formatDhakaDateTime, formatDuration } from "@/lib/utils";
import { plainContestText } from "@/lib/contest-text";

export function ContestDetailHeader({
  contest,
  actions,
}: {
  contest: ContestDetail;
  actions?: ReactNode;
}) {
  const countdownTarget =
    contest.status === "RUNNING"
      ? { target: contest.endAt, label: "Ends in" }
      : contest.status === "UPCOMING"
        ? { target: contest.startAt, label: "Starts in" }
        : null;
  const staffRole = contest.viewerStaffRole
    ? CONTEST_STAFF_ROLE_LABEL[contest.viewerStaffRole]
    : null;
  const staffActive =
    Boolean(staffRole) &&
    (contest.viewerStaffStatus === "INVITED" ||
      contest.viewerStaffStatus === "ACCEPTED");
  const snippet = plainContestText(contest.description);

  return (
    <header className="relative isolate overflow-hidden rounded-xl border border-border">
      <ContestBannerMedia bannerUrl={contest.bannerUrl ?? null} title={contest.title} />

      <div className="relative flex min-h-[260px] flex-col justify-end p-5 sm:min-h-[300px] sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <ContestStatusBadge status={contest.status} />
          <ContestFormatBadge
            format={contest.format ?? "SINGLE"}
            teamSize={contest.teamSize}
            showTeamSize={false}
            className="border-white/20 bg-black/25 text-white/90"
          />
          <span className="rounded-md border border-white/20 bg-black/25 px-2 py-0.5 text-[11px] font-medium text-white/85">
            {CONTEST_DIVISION_LABEL[contest.division]}
          </span>
          {contest.isOfficial ? (
            <Badge
              variant="outline"
              className="gap-1 border-white/25 bg-white/10 text-white"
            >
              <BadgeCheck className="size-3" aria-hidden="true" />
              {contest.seriesId ? "Monthly official" : "Official"}
            </Badge>
          ) : null}
          {contest.registered ? (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Registered
            </Badge>
          ) : null}
          {staffActive && staffRole ? (
            <Badge variant="warning" className="gap-1">
              <ShieldAlert className="size-3" aria-hidden="true" />
              Crew · {staffRole}
            </Badge>
          ) : null}
        </div>

        <h1 className="mt-3 max-w-4xl text-balance break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {contest.title}
        </h1>

        {snippet ? (
          <p className="mt-2 line-clamp-3 max-w-3xl break-words text-sm leading-relaxed text-white/90 drop-shadow-sm sm:text-base">
            {snippet}
          </p>
        ) : null}

        <ul className="mt-5 flex flex-wrap items-center gap-2 text-xs text-white/85">
          <li className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            <span
              className="font-mono"
              title={formatDateTime(contest.startAt)}
            >
              {formatDhakaDateTime(contest.startAt)}
            </span>
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <Clock3 className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {formatDuration(contestDurationMs(contest.startAt, contest.endAt))}
            </span>
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{contest.participantCount} registered</span>
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 backdrop-blur-sm">
            <ListChecks className="size-3.5 shrink-0" aria-hidden="true" />
            <span>
              {contest.problemCount} problem
              {contest.problemCount === 1 ? "" : "s"}
            </span>
          </li>
        </ul>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            {countdownTarget ? (
              <Countdown
                target={countdownTarget.target}
                label={countdownTarget.label}
                className="rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-xs text-white/90 backdrop-blur-sm"
              />
            ) : (
              <span className="text-xs font-medium text-white/70">
                Contest ended
              </span>
            )}
            {contest.status === "UPCOMING" ? (
              <span className="text-xs font-medium text-white/70">
                Standings open at the start
              </span>
            ) : (
              <Link
                href={`/contests/${contest.slug}/standings`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-semibold text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {contest.status === "ENDED"
                  ? "View final standings"
                  : "View live standings"}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
          {actions ? (
            <div className="w-full min-w-0 sm:ml-auto sm:w-auto">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function ContestCrewNotice({
  role,
  status,
  workspaceHref,
}: {
  role: ContestStaffRole;
  status: ContestStaffStatus | null;
  workspaceHref: string;
}) {
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          You are contest crew ({CONTEST_STAFF_ROLE_LABEL[role]}) — you cannot
          compete in this round.
        </p>
        <p className="mt-1 text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/80">
          Crew roles block registration, team membership and contest
          submissions.
          {status === "INVITED"
            ? " You were added directly by the contest team; contact the director if this is unexpected."
            : ""}
        </p>
      </div>
      <Link
        href={workspaceHref}
        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-amber-400/60 bg-amber-100/60 px-3 text-xs font-semibold hover:bg-amber-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-700 dark:bg-amber-900/60 dark:hover:bg-amber-900"
      >
        Crew workspace
      </Link>
    </div>
  );
}
