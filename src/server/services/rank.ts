import {
  and,
  count,
  eq,
  inArray,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { toOffset, type PaginationInput } from "@/server/api/validation";
import { getDb, type Database } from "@/server/db";
import { problems, submissions, users } from "@/server/db/schema";
import type {
  RankFacets,
  RankRow,
  RankSort,
  RankStanding,
} from "@/lib/types";
import { rankFacetValues } from "./rank-facets";
import {
  loadPresenceMap,
  NO_ACTIVITY_PRESENCE,
  presenceByUsername,
} from "./presence";
import { countedSubmission } from "./submission-filters";
import {
  rankCountryCondition,
  rankGlobalRankExpression,
  rankInstitutionCondition,
  rankSearchCondition,
  rankSolvedRangeCondition,
  rankSortOrder,
} from "./rank-filters";

export type RankFilters = {
  q?: string;
  institution?: string;
  country?: string;
  minSolved?: number;
  maxSolved?: number;
  sort?: RankSort;
};

export type RankQueryInput = PaginationInput & RankFilters;

/**
 * WHERE for the solved/totals aggregate: accepted practice submissions only —
 * no virtual contests, no assessments.
 */
export function rankSolvedConditions(): SQL {
  return and(
    eq(submissions.status, "ACCEPTED"),
    isNull(submissions.virtualContestId),
    countedSubmission(),
  )!;
}

/** WHERE for the per-user submission aggregate shown on the rank board. */
export function rankSubmissionAggConditions(usernames: string[]): SQL {
  return and(
    inArray(users.username, usernames),
    isNull(submissions.virtualContestId),
    countedSubmission(),
  )!;
}

/** Public boards never rank banned accounts. */
export function rankVisibleUserCondition(): SQL {
  return eq(users.isBanned, false);
}

function buildTotals(db: Database) {
  const solved = db
    .select({
      userId: submissions.userId,
      problemId: submissions.problemId,
      points: problems.points,
    })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .where(rankSolvedConditions())
    .groupBy(submissions.userId, submissions.problemId, problems.points)
    .as("solved");

  return db
    .select({
      userId: solved.userId,
      points: sql<number>`sum(${solved.points})::int`.as("points"),
      solvedCount: sql<number>`count(*)::int`.as("solved_count"),
    })
    .from(solved)
    .groupBy(solved.userId)
    .as("totals");
}

/**
 * Full ranked board: totals joined to the user profile with the global rank
 * window applied. Filters and pagination run on top of this, so a filtered row
 * keeps its real position instead of being renumbered from 1. Banned accounts
 * are excluded from the public board.
 */
export function buildRankedBoard(db: Database = getDb()) {
  const totals = buildTotals(db);

  return db
    .select({
      userId: totals.userId,
      username: users.username,
      displayName: users.displayName,
      institution: users.institution,
      country: users.country,
      points: totals.points,
      solvedCount: totals.solvedCount,
      avatarPreset: users.avatarPreset,
      avatarImageUpdatedAt: users.avatarImageUpdatedAt,
      globalRank: rankGlobalRankExpression({
        points: totals.points,
        solvedCount: totals.solvedCount,
        username: users.username,
      }).as("global_rank"),
    })
    .from(totals)
    .innerJoin(users, eq(users.id, totals.userId))
    .where(rankVisibleUserCondition())
    .as("ranked");
}

type RankedBoard = ReturnType<typeof buildRankedBoard>;

/** Combined WHERE for the ranking filters; undefined when nothing is filtered. */
function buildRankFilterCondition(
  input: RankQueryInput,
  board: RankedBoard,
): SQL | undefined {
  const clauses = [
    rankSearchCondition(input.q, board),
    rankInstitutionCondition(input.institution, board.institution),
    rankCountryCondition(input.country, board.country),
    rankSolvedRangeCondition(input.minSolved, input.maxSolved, board.solvedCount),
  ].filter((clause): clause is SQL => clause !== undefined);

  if (clauses.length === 0) return undefined;
  return clauses.length === 1 ? clauses[0] : and(...clauses)!;
}

export async function listRank(
  input: RankQueryInput,
  viewerId: string | null = null,
): Promise<{ items: RankRow[]; total: number }> {
  const db = getDb();
  const board = buildRankedBoard(db);
  const where = buildRankFilterCondition(input, board);
  const orderBy = rankSortOrder(input.sort, board);

  const [totalRow, rows] = await Promise.all([
    db.select({ value: count() }).from(board).where(where),
    db
      .select({
        username: board.username,
        displayName: board.displayName,
        institution: board.institution,
        country: board.country,
        points: board.points,
        solvedCount: board.solvedCount,
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
  const [submissionAgg, presenceRows] = await Promise.all([
    usernames.length > 0
      ? db
          .select({
            username: users.username,
            submissionCount: sql<number>`count(*)::int`.as("submission_count"),
            acceptedCount: sql<number>`(count(*) filter (where ${submissions.status} = 'ACCEPTED'))::int`.as("accepted_count"),
            lastAcceptedAt: sql<Date | null>`max(${submissions.createdAt}) filter (where ${submissions.status} = 'ACCEPTED')`.as("last_accepted_at"),
          })
          .from(submissions)
          .innerJoin(users, eq(users.id, submissions.userId))
          .where(rankSubmissionAggConditions(usernames))
          .groupBy(users.username)
      : Promise.resolve([]),
    usernames.length > 0
      ? db
          .select({
            id: users.id,
            username: users.username,
            lastActiveAt: users.lastActiveAt,
            presenceVisibility: users.presenceVisibility,
          })
          .from(users)
          .where(inArray(users.username, usernames))
      : Promise.resolve([]),
  ]);

  const aggByUser = new Map(submissionAgg.map((row) => [row.username, row]));
  const presenceMap = await loadPresenceMap(presenceRows, viewerId);
  const presenceByName = presenceByUsername(presenceRows, presenceMap);

  return {
    total: Number(totalRow[0]?.value ?? 0),
    items: rows.map((row) => {
      const agg = aggByUser.get(row.username);
      const submissionCount = Number(agg?.submissionCount ?? 0);
      const acceptedCount = Number(agg?.acceptedCount ?? 0);
      return {
        rank: Number(row.rank),
        username: row.username,
        displayName: row.displayName,
        institution: row.institution,
        country: row.country,
        points: Number(row.points),
        solvedCount: Number(row.solvedCount),
        submissionCount,
        acceptanceRate:
          submissionCount > 0 ? (acceptedCount / submissionCount) * 100 : 0,
        lastAcceptedAt: agg?.lastAcceptedAt
          ? new Date(agg.lastAcceptedAt).toISOString()
          : null,
        presence: presenceByName.get(row.username) ?? NO_ACTIVITY_PRESENCE,
        avatarPreset: row.avatarPreset,
        avatarImageUpdatedAt:
          row.avatarImageUpdatedAt?.toISOString() ?? null,
      };
    }),
  };
}

export async function listRankFacets(): Promise<RankFacets> {
  const db = getDb();
  const board = buildRankedBoard(db);
  const [institutions, countries, rankedCoders] = await Promise.all([
    rankFacetValues(board, board.institution),
    rankFacetValues(board, board.country),
    db.select({ value: count() }).from(board),
  ]);

  return {
    institutions,
    countries,
    rankedCoders: Number(rankedCoders[0]?.value ?? 0),
  };
}

/**
 * Profile rank uses the same window rank as the board so tied coders get one
 * consistent position (points, solved, username tie-break).
 */
export async function getUserRank(userId: string): Promise<number | null> {
  const standing = await getUserRankStanding(userId);
  return standing?.rank ?? null;
}

/** Global rank, points and solved count for one coder in a single query. */
export async function getUserRankStanding(
  userId: string,
): Promise<RankStanding> {
  const db = getDb();
  const board = buildRankedBoard(db);
  const rows = await db
    .select({
      rank: board.globalRank,
      points: board.points,
      solvedCount: board.solvedCount,
    })
    .from(board)
    .where(eq(board.userId, userId))
    .limit(1);

  const mine = rows[0];
  if (!mine) return null;

  return {
    rank: Number(mine.rank),
    points: Number(mine.points),
    solvedCount: Number(mine.solvedCount),
  };
}
