import Link from "next/link";
import { ClipboardCheck, Info, Sparkles, Trophy } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RankBoardTabs } from "@/components/rank/rank-board-tabs";
import { RankFilters } from "@/components/rank/rank-filters";
import { RankHero, rankActionClass } from "@/components/rank/rank-hero";
import { RankPagination } from "@/components/rank/rank-pagination";
import { RankPodium, type RankPodiumEntry } from "@/components/rank/rank-podium";
import { RankTable } from "@/components/rank/rank-table";
import { buttonVariants } from "@/components/ui/button";
import type { RankRow } from "@/lib/types";
import {
  hasActiveRankFilters,
  parseRankFilters,
  rankResultRange,
  rankSearchParams,
  solvedRange,
} from "@/lib/rank-filters";
import { readPage, type SearchParams } from "@/lib/pagination";
import {
  RANK_BOARD_META,
  rankBoardHref,
  rankSignInHref,
} from "@/lib/rating-rank";
import { getUserRankStanding, listRank, listRankFacets } from "@/server/services/rank";
import { cn, formatPercent } from "@/lib/utils";

function podiumEntries(items: RankRow[]): RankPodiumEntry[] {
  return items.slice(0, 3).map((row) => ({
    username: row.username,
    displayName: row.displayName,
    rank: row.rank,
    place: [row.institution, row.country].filter(Boolean).join(" · ") || "—",
    metricValue: String(row.points),
    metricUnit: "points",
    avatarPreset: row.avatarPreset,
    avatarImageAt: row.avatarImageUpdatedAt,
    detail: (
      <>
        <span className="block">{row.solvedCount} solved</span>
        <span className="block">
          {formatPercent(row.acceptanceRate)} accepted
        </span>
      </>
    ),
  }));
}

/** Points board: the practice leaderboard, unchanged in behaviour and URLs. */
export async function PointsBoard({
  params,
  viewer,
}: {
  params: SearchParams;
  viewer: { id: string; username: string } | null;
}) {
  const filters = parseRankFilters(params);
  const requestedPage = readPage(params);
  const range = solvedRange(filters.solved);
  const baseQuery = {
    pageSize: filters.pageSize,
    q: filters.q || undefined,
    institution: filters.institution || undefined,
    country: filters.country || undefined,
    minSolved: range.minSolved,
    maxSolved: range.maxSolved,
    sort: filters.sort,
  };

  const [requested, facets, standing] = await Promise.all([
    listRank({ ...baseQuery, page: requestedPage }, viewer?.id ?? null),
    listRankFacets(),
    viewer ? getUserRankStanding(viewer.id) : Promise.resolve(null),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(requested.total / filters.pageSize),
  );
  // A hand-edited or stale ?page= beyond the last page must not render the
  // "no coders" empty state; show the last real page instead.
  const page = Math.min(requestedPage, totalPages);
  const result =
    page === requestedPage || requested.total === 0
      ? requested
      : await listRank({ ...baseQuery, page }, viewer?.id ?? null);

  const { items, total } = result;
  const { from, to } = rankResultRange(page, filters.pageSize, total);
  const filtered = hasActiveRankFilters(filters);
  const paginationParams = rankSearchParams(filters);

  return (
    <>
      <RankHero
        eyebrow={RANK_BOARD_META.points.eyebrow}
        title={RANK_BOARD_META.points.title}
        description={RANK_BOARD_META.points.description}
        actions={
          <>
            <Link
              href="/reviewers"
              className={cn(
                buttonVariants({ variant: "outline" }),
                rankActionClass,
              )}
            >
              <ClipboardCheck className="size-4" /> Reviewers
            </Link>
            <Link
              href="/problems"
              className={cn(buttonVariants(), rankActionClass)}
            >
              <Sparkles className="size-4" /> Solve a problem
            </Link>
          </>
        }
        tabs={
          <RankBoardTabs
            active="points"
            pointsHref={rankBoardHref("points", params)}
            ratingHref={rankBoardHref("rating", params)}
          />
        }
        totalLabel="Ranked coders"
        totalCoders={facets.rankedCoders}
        totalHint="All-time, points-based"
        totalIcon={Trophy}
        matchingCoders={total}
        filtered={filtered}
        page={page}
        totalPages={totalPages}
        shownFrom={from}
        shownTo={to}
        viewer={viewer}
        standing={
          standing
            ? {
                rank: standing.rank,
                primary: `${standing.points} points`,
                secondary: `${standing.solvedCount} solved`,
              }
            : null
        }
        unratedHint="Solve a problem to enter the board."
        guestHint="Track your rank, points and solves."
        signInHref={rankSignInHref("points")}
      />

      {page === 1 && items.length >= 3 && filters.sort === "points" ? (
        <RankPodium
          entries={podiumEntries(items)}
          filtered={filtered}
          currentUsername={viewer?.username}
        />
      ) : null}

      <RankFilters filters={filters} facets={facets} total={total} />

      <section aria-labelledby="rank-results-heading" className="mt-6">
        <h2 id="rank-results-heading" className="sr-only">
          Ranking results
        </h2>
        {items.length === 0 ? (
          filtered ? (
            <EmptyState
              title="No coders match these filters"
              description="Try a different search, institution, country or solved bracket."
              icon={Trophy}
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link href="/rank" className={buttonVariants()}>
                    Clear filters
                  </Link>
                  <Link
                    href="/problems"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Browse problems
                  </Link>
                </div>
              }
            />
          ) : (
            <EmptyState
              title="Nobody on the board yet"
              description="Solve a problem to claim the first spot."
              icon={Trophy}
              action={
                <Link href="/problems" className={buttonVariants()}>
                  Browse problems
                </Link>
              }
            />
          )
        ) : (
          <RankTable
            items={items}
            currentUsername={viewer?.username}
            caption={`Global ranking, page ${page} of ${totalPages}, showing ${from} to ${to} of ${total} coders`}
          />
        )}
      </section>

      {items.length > 0 ? (
        <RankPagination
          searchParams={paginationParams}
          page={page}
          pageSize={filters.pageSize}
          total={total}
        />
      ) : null}

      <section
        aria-labelledby="how-points-work-heading"
        className="mt-10 rounded-lg border border-border bg-muted/30 p-4"
      >
        <div className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-background text-primary ring-1 ring-border">
            <Trophy aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2
              id="how-points-work-heading"
              className="text-sm font-semibold"
            >
              How points work
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Each problem is worth its listed points. Only your first accepted
              submission counts. Rejected submissions do not remove points, and
              solving the same problem again does not add points. Contest
              submissions count toward both ranking and contest standings.
            </p>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              Rank is global: filters narrow the board but never renumber it.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
