import { describe, expect, expectTypeOf, it } from "vitest";
import { sql, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PresenceInfo } from "@/lib/follow-types";
import type { RatingRow } from "@/lib/rating-rank-types";
import { users } from "@/server/db/schema";
import * as schema from "@/server/db/schema";
import {
  buildRankedBoard,
  buildRatedBoard,
  listRatingRank,
} from "./rating-rank";
import {
  ratingGlobalRankExpression,
  ratingRangeCondition,
  ratingSortOrder,
} from "./rating-rank-filters";

const dialect = new PgDialect();

function render(condition: SQL): string {
  return dialect.sqlToQuery(condition).sql;
}

function renderParams(condition: SQL): unknown[] {
  return dialect.sqlToQuery(condition).params;
}

/** Query builder without a connection: no rows are read in these tests. */
const db = drizzle.mock({ schema });

/** Rendered SQL of the rated subquery, including its joins and WHERE. */
function ratedBoardSql(): string {
  return db.select().from(buildRatedBoard(db)).toSQL().sql;
}

/** Mirrors the ranked board columns: aggregates surface as SQL aliases. */
const board = {
  username: users.username,
  rating: users.rating,
  maxRating: sql<number>`greatest(${users.rating}, ${users.rating})::int`.as(
    "max_rating",
  ),
  contestCount: sql<number>`count(*)::int`.as("contest_count"),
};

describe("rating row presence contract", () => {
  it("types presence on every RatingRow", () => {
    expectTypeOf<RatingRow["presence"]>().toEqualTypeOf<PresenceInfo>();
  });

  it("accepts an optional viewer for presence visibility", () => {
    expectTypeOf(listRatingRank).toBeCallableWith({ page: 1, pageSize: 10 });
    expectTypeOf(listRatingRank).toBeCallableWith(
      { page: 1, pageSize: 10 },
      "viewer-1",
    );
    expectTypeOf(listRatingRank).toBeCallableWith(
      { page: 1, pageSize: 10 },
      null,
    );
  });
});

describe("rated-only definition", () => {
  it("builds the board from contest rating changes, not from users.rating", () => {
    const rendered = ratedBoardSql();

    expect(rendered).toContain('from "contest_rating_changes"');
    expect(rendered).toContain('group by "contest_rating_changes"."user_id"');
    expect(rendered).toContain(
      'inner join (select "user_id", "contest_id", "delta", "created_at"',
    );
    expect(rendered).toContain(
      '"last_rating_change"."user_id" = "rating_totals"."user_id"',
    );
  });

  it("takes the peak rating from the change history", () => {
    expect(ratedBoardSql()).toContain(
      'greatest("users"."rating", "max_change_rating")::int as "max_rating"',
    );
  });

  it("picks the latest change by contest end and contest id", () => {
    expect(ratedBoardSql()).toContain(
      '(row_number() over (partition by "user_id" order by "created_at" desc, "contest_id" desc))',
    );
  });
});

describe("banned exclusion", () => {
  it("filters banned users out of the rated board", () => {
    const rendered = ratedBoardSql();

    expect(rendered).toContain('"users"."is_banned" = ');
    expect(db.select().from(buildRatedBoard(db)).toSQL().params).toContain(false);
  });

  it("only admits finalized SINGLE contests", () => {
    const rendered = ratedBoardSql();

    expect(rendered).toContain('"contests"."format" = ');
    expect(rendered).toContain('"contests"."rated_at" is not null');
  });
});

describe("rating filters", () => {
  it("applies an inclusive rating range on the current rating", () => {
    const condition = ratingRangeCondition(1600, 1900, board.rating)!;

    expect(render(condition)).toBe('("users"."rating" >= $1 and "users"."rating" <= $2)');
    expect(renderParams(condition)).toEqual([1600, 1900]);
  });

  it("supports open-ended rating ranges", () => {
    const minOnly = ratingRangeCondition(1600, undefined, board.rating)!;
    const maxOnly = ratingRangeCondition(undefined, 1900, board.rating)!;

    expect(render(minOnly)).toBe('"users"."rating" >= $1');
    expect(render(maxOnly)).toBe('"users"."rating" <= $1');
  });

  it("skips the range when both bounds are absent", () => {
    expect(
      ratingRangeCondition(undefined, undefined, board.rating),
    ).toBeUndefined();
  });
});

describe("rating sort order", () => {
  it("defaults to rating, peak, contests and username (the global rank order)", () => {
    expect(ratingSortOrder(undefined, board).map(render)).toEqual([
      '"users"."rating" desc',
      '"max_rating" desc',
      '"contest_count" desc',
      '"users"."username" asc',
    ]);
  });

  it("treats `rating` explicitly like the default", () => {
    expect(ratingSortOrder("rating", board).map(render)).toEqual(
      ratingSortOrder(undefined, board).map(render),
    );
  });

  it("orders `peak` by peak, then rating, then contests, then username", () => {
    expect(ratingSortOrder("peak", board).map(render)).toEqual([
      '"max_rating" desc',
      '"users"."rating" desc',
      '"contest_count" desc',
      '"users"."username" asc',
    ]);
  });

  it("orders `contests` by contest count, then rating, then peak, then username", () => {
    expect(ratingSortOrder("contests", board).map(render)).toEqual([
      '"contest_count" desc',
      '"users"."rating" desc',
      '"max_rating" desc',
      '"users"."username" asc',
    ]);
  });

  it("orders `name` by username only", () => {
    expect(ratingSortOrder("name", board).map(render)).toEqual([
      '"users"."username" asc',
    ]);
  });
});

describe("global rating rank window", () => {
  it("numbers rows by rating, peak, contest count and username", () => {
    const expression = ratingGlobalRankExpression(board);

    expect(render(expression)).toBe(
      '(row_number() over (order by "users"."rating" desc, "max_rating" desc, "contest_count" desc, "users"."username" asc))::int',
    );
  });

  it("applies the window over the full rated set before filters", () => {
    const ranked = db.select().from(buildRankedBoard(db)).toSQL().sql;

    expect(ranked).toContain(
      '(row_number() over (order by "rating" desc, "max_rating" desc, "contest_count" desc, "username" asc))::int as "global_rank"',
    );
  });
});
