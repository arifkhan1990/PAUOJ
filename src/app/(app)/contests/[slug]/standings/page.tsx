import type { Metadata } from "next";
import Link from "next/link";
import { Info, Trophy } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ContestFormatBadge } from "@/components/contests/contest-format-badge";
import { ContestTabs } from "@/components/contests/contest-tabs";
import { buttonVariants } from "@/components/ui/button";
import { StandingsLive } from "@/features/contests/standings-live";
import { getCurrentUser } from "@/server/auth/session";
import { ApiError } from "@/server/api/errors";
import { getScoreboard } from "@/server/services/contests";
import type { ContestScoreboard } from "@/lib/types";
import { SCOREBOARD_DEFAULT_PAGE_SIZE } from "@/lib/contest-detail-types";
import { contestDurationMs } from "@/lib/contests";
import { readPage, type SearchParams } from "@/lib/pagination";
import {
  formatDhakaDateTime,
  formatDuration,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Standings · ${slug}` };
}

export default async function StandingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const page = readPage(query);
  const user = await getCurrentUser();
  let board: ContestScoreboard | null = null;
  let message: string | null = null;

  try {
    board = await getScoreboard(slug, user?.role === "ADMIN", {
      page,
      pageSize: SCOREBOARD_DEFAULT_PAGE_SIZE,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      message = error.message;
    } else {
      throw error;
    }
  }

  if (!board) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="sr-only">Standings</h1>
        <EmptyState
          title="Standings unavailable"
          description={message ?? "This contest could not be found."}
          icon={Trophy}
          action={
            <Link
              href={`/contests/${slug}`}
              prefetch={false}
              className={buttonVariants()}
            >
              Back to contest
            </Link>
          }
        />
      </div>
    );
  }

  const format = board.contest.format ?? "SINGLE";
  const isGroup = format === "GROUP";
  const total = board.pagination.total;
  const participantLabel = `${total.toLocaleString("en-US")} ${
    isGroup ? "team" : "coder"
  }${total === 1 ? "" : "s"}`;
  const reviewOpen =
    new Date(board.contest.ratingReviewEndsAt).getTime() > Date.now();
  // A running board can change every few seconds. Render a light shell and let
  // the cached API fill the rows, so 10k first loads do not each run RSC over
  // 50 ranked rows. Ended/upcoming boards stay fully server-rendered.
  const deferInitialRows = board.contest.status === "RUNNING" && total > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Live standings"
        title={board.contest.title}
        description={`ICPC scoring · ${
          isGroup
            ? `team round, up to ${board.contest.teamSize} coders per team`
            : "solo round"
        } · ${formatDuration(contestDurationMs(board.contest.startAt, board.contest.endAt))}. Started ${formatDhakaDateTime(board.contest.startAt)} and ends ${formatDhakaDateTime(board.contest.endAt)}.`}
        actions={
          <Link
            href={`/contests/${board.contest.slug}`}
            prefetch={false}
            className={buttonVariants({ variant: "outline" })}
          >
            Contest page
          </Link>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ContestFormatBadge
          format={format}
          teamSize={board.contest.teamSize}
        />
        <span className="rounded border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {participantLabel}
        </span>
      </div>

      {board.contest.status === "ENDED" ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            {isGroup
              ? "Team round — no individual rating changes."
              : board.contest.ratingFinalizedAt
                ? `Ratings finalized ${formatDhakaDateTime(board.contest.ratingFinalizedAt)}.`
                : reviewOpen
                  ? `Standings are final. Ratings are under review and finalize at ${formatDhakaDateTime(board.contest.ratingReviewEndsAt)} (one hour after the contest ends).`
                  : "Standings are final. Ratings are awaiting finalization after the review window."}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Solve more problems to rank higher. Ties are broken by lower penalty,
          then by the time of the last accepted submission.
        </p>
        <span className="rounded border border-border bg-muted/60 px-2 py-1 text-xs font-medium">
          {board.contest.status === "RUNNING" ? "Live" : board.contest.status === "ENDED" ? "Final" : "Upcoming"}
        </span>
      </div>

      <ContestTabs
        slug={board.contest.slug}
        active="standings"
        className="mt-4"
      />

      {board.frozen && board.freezeAt ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          Standings are frozen from {formatDhakaDateTime(board.freezeAt)} until the
          contest ends. Admins still see the live scoreboard.
        </div>
      ) : null}

      {total === 0 ? (
        <EmptyState
          className="mt-6"
          title="No registered participants"
          description="The scoreboard will appear when users register and submit."
          icon={Trophy}
        />
      ) : (
        <StandingsLive
          key={`${board.pagination.page}:${deferInitialRows ? "deferred" : "ssr"}`}
          slug={board.contest.slug}
          initialBoard={
            deferInitialRows ? { ...board, rows: [] } : board
          }
          deferInitialRows={deferInitialRows}
        />
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Cell format: <span className="font-mono">minutes</span> for an accepted
        problem, <span className="font-mono">+n</span> for rejected attempts
        before acceptance, and <span className="font-mono">-n</span> for
        unsolved problems with rejected attempts. A lightning icon marks the
        first accepted solve of each problem.
      </p>
    </div>
  );
}
