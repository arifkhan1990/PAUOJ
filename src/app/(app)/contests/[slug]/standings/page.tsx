import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { AutoRefresh } from "@/components/shared/auto-refresh";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ContestTabs } from "@/components/contests/contest-tabs";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreboardTable } from "@/features/contests/scoreboard-table";
import { getCurrentUser } from "@/server/auth/session";
import { ApiError } from "@/server/api/errors";
import { getScoreboard } from "@/server/services/contests";
import type { ContestScoreboard } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();
  let board: ContestScoreboard | null = null;
  let message: string | null = null;

  try {
    board = await getScoreboard(slug, user?.role === "ADMIN");
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
        <EmptyState
          title="Standings unavailable"
          description={message ?? "This contest could not be found."}
          icon={Trophy}
          action={
            <Link href={`/contests/${slug}`} className={buttonVariants()}>
              Back to contest
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AutoRefresh enabled={board.contest.status === "RUNNING"} intervalMs={15000} />
      <PageHeader
        eyebrow="Live standings"
        title={board.contest.title}
        description={`ICPC scoring. Started ${formatDateTime(board.contest.startAt)} and ends ${formatDateTime(board.contest.endAt)}.`}
        actions={
          <Link
            href={`/contests/${board.contest.slug}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Contest page
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
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
          Standings are frozen from {formatDateTime(board.freezeAt)} until the
          contest ends. Admins still see the live scoreboard.
        </div>
      ) : null}

      {board.rows.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="No registered participants"
          description="The scoreboard will appear when users register and submit."
          icon={Trophy}
        />
      ) : (
        <Card className="mt-5 overflow-hidden p-1">
          <ScoreboardTable board={board} />
        </Card>
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
