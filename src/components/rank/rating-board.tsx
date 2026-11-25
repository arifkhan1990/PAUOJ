import Link from "next/link";
import { Gauge, Info, Sparkles, Swords, Trophy } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RankBoardTabs } from "@/components/rank/rank-board-tabs";
import { RankFilters } from "@/components/rank/rank-filters";
import { RankHero, rankActionClass } from "@/components/rank/rank-hero";
import { RankPagination } from "@/components/rank/rank-pagination";
import { RankPodium, type RankPodiumEntry } from "@/components/rank/rank-podium";
import { RatingTable } from "@/components/rank/rating-table";
import { RatingTierBadge } from "@/components/rank/rating-tier-badge";
import { buttonVariants } from "@/components/ui/button";
import { readPage, type SearchParams } from "@/lib/pagination";
import {
  RANK_BOARD_META,
  hasActiveRatingFilters,
  parseRatingFilters,
  rankBoardHref,
  rankBoardResetHref,
  rankSignInHref,
  ratingSearchParams,
  ratingTierRange,
} from "@/lib/rating-rank";
import type { RatingRow } from "@/lib/rating-rank-types";
import { rankResultRange } from "@/lib/rank-filters";
import { getRatingTier } from "@/lib/rating-tiers";
import {
  getUserRatingStanding,
  listRatingFacets,
  listRatingRank,
} from "@/server/services/rating-rank";
import { cn } from "@/lib/utils";

function podiumEntries(items: RatingRow[]): RankPodiumEntry[] {
  return items.slice(0, 3).map((row) => {
    const tier = getRatingTier(row.rating);
    return {
      username: row.username,
      displayName: row.displayName,
      rank: row.rank,
      place: [row.institution, row.country].filter(Boolean).join(" · ") || "—",
      metricValue: String(row.rating),
      metricUnit: "rating",
      nameClassName: tier.textClassName,
      tierKey: tier.key,
      avatarPreset: row.avatarPreset,
      avatarImageAt: row.avatarImageUpdatedAt,
      metricNote: <RatingTierBadge rating={row.rating} />,
      detail: (
        <>
          <span className="block">Peak {row.maxRating}</span>
          <span className="block">
            {row.contestCount} {row.contestCount === 1 ? "contest" : "contests"}
          </span>
        </>
      ),
    };
  });
}

const explainerPoints = [
  "Elo updates your rating after every finalized rated solo contest, with K = 32.",
  "Ratings finalize one hour after a contest ends, after the review and rejudge window.",
  "Only rated solo contests count. Unrated or unfinalized contests never move your rating.",
  "GROUP contests do not change rating.",
  "Peak rating is the highest rating you have ever reached.",
];

/** Rating board: Elo leaderboard from finalized rated solo contests. */
export async function RatingBoard({
  params,
  viewer,
}: {
  params: SearchParams;
  viewer: { id: string; username: string } | null;
}) {
  const filters = parseRatingFilters(params);
  const requestedPage = readPage(params);
  const range = ratingTierRange(filters.tier);
  const baseQuery = {
    pageSize: filters.pageSize,
    q: filters.q || undefined,
    institution: filters.institution || undefined,
    country: filters.country || undefined,
    minRating: range.minRating,
    maxRating: range.maxRating,
    sort: filters.sort,
  };

  const [requested, facets, standing] = await Promise.all([
    listRatingRank({ ...baseQuery, page: requestedPage }, viewer?.id ?? null),
    listRatingFacets(),
    viewer ? getUserRatingStanding(viewer.id) : Promise.resolve(null),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(requested.total / filters.pageSize),
  );
  // Clamp stale or hand-edited pages to the last real page, exactly like the
  // points board, so an empty board is a real empty board.
  const page = Math.min(requestedPage, totalPages);
  const result =
    page === requestedPage || requested.total === 0
      ? requested
      : await listRatingRank({ ...baseQuery, page }, viewer?.id ?? null);

  const { items, total } = result;
  const { from, to } = rankResultRange(page, filters.pageSize, total);
  const filtered = hasActiveRatingFilters(filters);
  const resetHref = rankBoardResetHref("rating");

  return (
    <>
      <RankHero
        eyebrow={RANK_BOARD_META.rating.eyebrow}
        title={RANK_BOARD_META.rating.title}
        description="Coders ranked by Elo rating from finalized rated solo contests. Practice points live on the points board."
        actions={
          <>
            <Link
              href="/contests"
              className={cn(
                buttonVariants({ variant: "outline" }),
                rankActionClass,
              )}
            >
              <Swords className="size-4" aria-hidden="true" /> Contests
            </Link>
            <Link
              href="/problems"
              className={cn(buttonVariants(), rankActionClass)}
            >
              <Sparkles className="size-4" aria-hidden="true" /> Solve a problem
            </Link>
          </>
        }
        tabs={
          <RankBoardTabs
            active="rating"
            pointsHref={rankBoardHref("points", params)}
            ratingHref={rankBoardHref("rating", params)}
          />
        }
        totalLabel="Rated coders"
        totalCoders={facets.ratedCoders}
        totalHint="Finalized rated contests"
        totalIcon={Gauge}
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
                primary: `${standing.rating} rating`,
                secondary: `Peak ${standing.maxRating} · ${standing.contestCount} ${
                  standing.contestCount === 1 ? "contest" : "contests"
                }`,
              }
            : null
        }
        unratedHint="Join a rated contest to enter the rating ladder."
        guestHint="Track your rating and contest history."
        signInHref={rankSignInHref("rating")}
      />

      {page === 1 && items.length >= 3 && filters.sort === "rating" ? (
        <RankPodium
          entries={podiumEntries(items)}
          filtered={filtered}
          currentUsername={viewer?.username}
          title={filtered ? "Top of this board" : "Top rated coders"}
          description={
            filtered
              ? "The three highest-rated coders on the current board."
              : "The three highest-rated coders from finalized rated contests."
          }
          headingId="rating-podium-heading"
        />
      ) : null}

      <RankFilters board="rating" filters={filters} facets={facets} total={total} />

      <section aria-labelledby="rating-results-heading" className="mt-6">
        <h2 id="rating-results-heading" className="sr-only">
          Rating results
        </h2>
        {items.length === 0 ? (
          facets.ratedCoders === 0 ? (
            <EmptyState
              title="No rated coders yet"
              description="Finish a rated solo contest and the Elo board opens with your first rating."
              icon={Trophy}
              action={
                <Link href="/contests" className={buttonVariants()}>
                  Browse contests
                </Link>
              }
            />
          ) : (
            <EmptyState
              title="No rated coders match these filters"
              description="Try a different search, institution, country or rating tier."
              icon={Trophy}
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link href={resetHref} className={buttonVariants()}>
                    Clear filters
                  </Link>
                  <Link
                    href="/contests"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Browse contests
                  </Link>
                </div>
              }
            />
          )
        ) : (
          <RatingTable
            items={items}
            currentUsername={viewer?.username}
            caption={`Global rating ranking, page ${page} of ${totalPages}, showing ${from} to ${to} of ${total} rated coders`}
          />
        )}
      </section>

      {items.length > 0 ? (
        <RankPagination
          searchParams={ratingSearchParams(filters)}
          page={page}
          pageSize={filters.pageSize}
          total={total}
        />
      ) : null}

      <section
        aria-labelledby="how-rating-works-heading"
        className="mt-10 rounded-lg border border-border bg-muted/30 p-4"
      >
        <div className="flex gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-background text-primary ring-1 ring-border">
            <Gauge aria-hidden="true" className="size-4" />
          </span>
          <div>
            <h2 id="how-rating-works-heading" className="text-sm font-semibold">
              How contest rating works
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              {explainerPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
              Global ranks are computed before filters; filtering the board
              never renumbers it.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
