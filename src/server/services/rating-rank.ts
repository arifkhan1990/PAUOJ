import {
  and,
  count,
  eq,
  inArray,
  isNotNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb, type Database } from "@/server/db";
import { contestRatingChanges, contests, users } from "@/server/db/schema";
import type {
  RatingFacets,
  RatingRow,
  RatingSort,
  RatingStanding,
} from "@/lib/rating-rank-types";
import { rankFacetValues } from "./rank-facets";
import {
  loadPresenceMap,
  NO_ACTIVITY_PRESENCE,
  presenceByUsername,
} from "./presence";
import {
  rankCountryCondition,
  rankInstitutionCondition,
  rankSearchCondition,
} from "./rank-filters";
import {
  ratingGlobalRankExpression,
  ratingRangeCondition,
  ratingSortOrder,
} from "./rating-rank-filters";

export type RatingFilters = {
  q?: string;
  institution?: string;
  country?: string;
  minRating?: number;
  maxRating?: number;
  sort?: RatingSort;
};

export type RatingQueryInput = PaginationInput & RatingFilters;

/**
 * Per-user rating totals. A user appears here only when they have at least one
 * row in `contest_rating_changes`, which is the rated-coder definition: the
 * default `users.rating` alone never puts anybody on the board.
 */
function buildRatedTotals(db: Database) {
  return db
    .select({
      userId: contestRatingChanges.userId,
      maxChangeRating: sql<number>`max(${contestRatingChanges.newRating})::int`.as(
        "max_change_rating",
      ),
      contestCount: sql<number>`count(*)::int`.as("contest_count"),
    })
    .from(contestRatingChanges)
    .groupBy(contestRatingChanges.userId)
    .as("rating_totals");
}

/**
 * Latest row per user. `created_at` is the contest end timestamp written by the
 * finalizer, and `contest_id` breaks ties so the choice is deterministic.
 */
function buildLatestChanges(db: Database) {
  return db
    .select({
      userId: contestRatingChanges.userId,
      contestId: contestRatingChanges.contestId,
      delta: contestRatingChanges.delta,
      createdAt: contestRatingChanges.createdAt,
      changeRank: sql<number>`(row_number() over (partition by ${contestRatingChanges.userId} order by ${contestRatingChanges.createdAt} desc, ${contestRatingChanges.contestId} desc))::int`.as(
        "change_rank",
      ),
    })
    .from(contestRatingChanges)
    .as("last_rating_change");
}

/**
 * Rated coders with their current rating, peak rating, contest count and last
 * change. Banned accounts are excluded here, so counts, facets and ranks all
 * share the same public population.
 */
export function buildRatedBoard(db: Database) {
  const totals = buildRatedTotals(db);
  const latest = buildLatestChanges(db);

  return db
    .select({
      userId: totals.userId,
      username: users.username,
      displayName: users.displayName,
      institution: users.institution,
      country: users.country,
      rating: users.rating,
      maxRating: sql<number>`greatest(${users.rating}, ${totals.maxChangeRating})::int`.as(
        "max_rating",
      ),
      contestCount: totals.contestCount,
      lastDelta: latest.delta,
      lastContestAt: latest.createdAt,
      lastContestSlug: contests.slug,
      lastContestTitle: contests.title,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
    })
    .from(totals)
    .innerJoin(
      latest,
      and(eq(latest.userId, totals.userId), eq(latest.changeRank, 1)),
    )
    .innerJoin(users, eq(users.id, totals.userId))
    .innerJoin(contests, eq(contests.id, latest.contestId))
    .where(
      and(
        eq(users.isBanned, false),
        eq(contests.format, "SINGLE"),
        isNotNull(contests.ratedAt),
      ),
    )
    .as("rated_coders");
}

/**
 * Full ranked board: the global rank window runs over every rated coder before
 * filters and pagination, so a filtered row keeps its real position instead of
 * being renumbered from 1.
 */
export function buildRankedBoard(db: Database) {
  const rated = buildRatedBoard(db);

  return db
    .select({
      userId: rated.userId,
      username: rated.username,
      displayName: rated.displayName,
      institution: rated.institution,
      country: rated.country,
      rating: rated.rating,
      maxRating: rated.maxRating,
      contestCount: rated.contestCount,
      lastDelta: rated.lastDelta,
      lastContestAt: rated.lastContestAt,
      lastContestSlug: rated.lastContestSlug,
      lastContestTitle: rated.lastContestTitle,
      avatarPreset: rated.avatarPreset,
      avatarImageUpdatedAt: rated.avatarImageUpdatedAt,
      globalRank: ratingGlobalRankExpression({
        rating: rated.rating,
        maxRating: rated.maxRating,
        contestCount: rated.contestCount,
        username: rated.username,
      }).as("global_rank"),
    })
    .from(rated)
    .as("rating_rank");
}

type RankedBoard = ReturnType<typeof buildRankedBoard>;

/** Combined WHERE for the rating filters; undefined when nothing is filtered. */
function buildRatingFilterCondition(
  input: RatingQueryInput,
  board: RankedBoard,
): SQL | undefined {
  const clauses = [
    rankSearchCondition(input.q, board),
    rankInstitutionCondition(input.institution, board.institution),
    rankCountryCondition(input.country, board.country),
    ratingRangeCondition(input.minRating, input.maxRating, board.rating),
  ].filter((clause): clause is SQL => clause !== undefined);

  if (clauses.length === 0) return undefined;
  return clauses.length === 1 ? clauses[0] : and(...clauses)!;
}

export async function listRatingRank(
  input: RatingQueryInput,
  viewerId: string | null = null,
): Promise<{ items: RatingRow[]; total: number }> {
  const db = getDb();
  const board = buildRankedBoard(db);
  const where = buildRatingFilterCondition(input, board);
  const orderBy = ratingSortOrder(input.sort, board);

  const [totalRow, rows] = await Promise.all([
    db.select({ value: count() }).from(board).where(where),
    db
      .select({
        username: board.username,
        displayName: board.displayName,
        institution: board.institution,
        country: board.country,
        rating: board.rating,
        maxRating: board.maxRating,
        contestCount: board.contestCount,
        lastDelta: board.lastDelta,
        lastContestAt: board.lastContestAt,
        lastContestSlug: board.lastContestSlug,
        lastContestTitle: board.lastContestTitle,
        avatarPreset: board.avatarPreset,
        avatarImageUpdatedAt: board.avatarImageUpdatedAt,
        rank: board.globalRank,
      })
      .from(board)
      .where(where)
      .orderBy(...orderBy)
      .limit(input.pageSize)
      .offset(toOffset(input)),
  ]);

  const usernames = rows.map((row) => row.username);
  const presenceRows =
    usernames.length > 0
      ? await db
          .select({
            id: users.id,
            username: users.username,
            lastActiveAt: users.lastActiveAt,
            presenceVisibility: users.presenceVisibility,
          })
          .from(users)
          .where(inArray(users.username, usernames))
      : [];
  const presenceMap = await loadPresenceMap(presenceRows, viewerId);
  const presenceByName = presenceByUsername(presenceRows, presenceMap);

  return {
    total: Number(totalRow[0]?.value ?? 0),
    items: rows.map((row) => ({
      rank: Number(row.rank),
      username: row.username,
      displayName: row.displayName,
      institution: row.institution,
      country: row.country,
      rating: Number(row.rating),
      maxRating: Number(row.maxRating),
      contestCount: Number(row.contestCount),
      lastDelta: Number(row.lastDelta),
      lastContestAt: new Date(row.lastContestAt).toISOString(),
      lastContestSlug: row.lastContestSlug,
      lastContestTitle: row.lastContestTitle,
      presence: presenceByName.get(row.username) ?? NO_ACTIVITY_PRESENCE,
      avatarPreset: row.avatarPreset,
      avatarImageUpdatedAt:
        row.avatarImageUpdatedAt?.toISOString() ?? null,
    })),
  };
}

/** Top institutions, countries and the rated-coder count for the facets. */
export async function listRatingFacets(): Promise<RatingFacets> {
  const db = getDb();
  const board = buildRatedBoard(db);
  const [institutions, countries, ratedCoders] = await Promise.all([
    rankFacetValues(board, board.institution),
    rankFacetValues(board, board.country),
    db.select({ value: count() }).from(board),
  ]);

  return {
    institutions,
    countries,
    ratedCoders: Number(ratedCoders[0]?.value ?? 0),
  };
}

/**
 * Global rating standing for one coder. Returns null for an unrated or banned
 * user, matching the board's membership rules.
 */
export async function getUserRatingStanding(
  userId: string,
): Promise<RatingStanding> {
  const db = getDb();
  const board = buildRankedBoard(db);
  const rows = await db
    .select({
      rank: board.globalRank,
      rating: board.rating,
      maxRating: board.maxRating,
      contestCount: board.contestCount,
    })
    .from(board)
    .where(eq(board.userId, userId))
    .limit(1);

  const mine = rows[0];
  if (!mine) return null;

  return {
    rank: Number(mine.rank),
    rating: Number(mine.rating),
    maxRating: Number(mine.maxRating),
    contestCount: Number(mine.contestCount),
  };
}
