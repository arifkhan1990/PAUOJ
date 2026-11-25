import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { ApiError, isApiError } from "./errors";
import { parseQuery, rankQuerySchema, ratingQuerySchema } from "./validation";

/** parseQuery only reads `request.url`, so a cast placeholder is enough. */
function requestFor(search: string): NextRequest {
  return { url: `http://localhost/api/v1/rank${search}` } as unknown as NextRequest;
}

describe("rankQuerySchema", () => {
  it("defaults pagination and sort", () => {
    const parsed = rankQuerySchema.parse({});

    expect(parsed).toEqual({ page: 1, pageSize: 20, sort: "points" });
  });

  it("accepts and normalises the full filter set", () => {
    const parsed = rankQuerySchema.parse({
      page: "2",
      pageSize: "25",
      q: "  ada  ",
      institution: "  PrimeAsia University ",
      country: " Bangladesh ",
      minSolved: "1",
      maxSolved: "50",
      sort: "solved",
    });

    expect(parsed).toEqual({
      page: 2,
      pageSize: 25,
      q: "ada",
      institution: "PrimeAsia University",
      country: "Bangladesh",
      minSolved: 1,
      maxSolved: 50,
      sort: "solved",
    });
  });

  it("accepts every sort value", () => {
    for (const sort of ["points", "solved", "name"] as const) {
      expect(rankQuerySchema.parse({ sort }).sort).toBe(sort);
    }
  });

  it("treats blank numeric filters as unset instead of zero", () => {
    const parsed = rankQuerySchema.parse({ minSolved: "", maxSolved: "  " });

    expect(parsed.minSolved).toBeUndefined();
    expect(parsed.maxSolved).toBeUndefined();
  });

  it("treats blank pagination and sort params as unset", () => {
    const parsed = rankQuerySchema.parse({
      page: "",
      pageSize: "  ",
      sort: "",
    });

    expect(parsed).toEqual({ page: 1, pageSize: 20, sort: "points" });
  });

  it("rejects an unknown sort", () => {
    const result = rankQuerySchema.safeParse({ sort: "rating" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["sort"]);
    }
  });

  it("rejects minSolved above maxSolved", () => {
    const result = rankQuerySchema.safeParse({ minSolved: "10", maxSolved: "3" });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toEqual(["minSolved"]);
      expect(issue?.message).toContain("minSolved must be less than or equal to maxSolved");
    }
  });

  it("accepts equal solved bounds", () => {
    expect(rankQuerySchema.parse({ minSolved: "4", maxSolved: "4" }).minSolved).toBe(4);
  });

  it("rejects out-of-range solved counts", () => {
    expect(rankQuerySchema.safeParse({ minSolved: "-1" }).success).toBe(false);
    expect(rankQuerySchema.safeParse({ maxSolved: "100001" }).success).toBe(false);
    expect(rankQuerySchema.safeParse({ minSolved: "2.5" }).success).toBe(false);
  });

  it("rejects over-long text filters", () => {
    expect(rankQuerySchema.safeParse({ q: "a".repeat(101) }).success).toBe(false);
    expect(
      rankQuerySchema.safeParse({ institution: "a".repeat(121) }).success,
    ).toBe(false);
    expect(rankQuerySchema.safeParse({ country: "a".repeat(81) }).success).toBe(
      false,
    );
  });

  it("caps the page size like other list endpoints", () => {
    expect(rankQuerySchema.safeParse({ pageSize: "51" }).success).toBe(false);
    expect(rankQuerySchema.safeParse({ pageSize: "50" }).success).toBe(true);
  });

  it("surfaces the 422 ApiError shape from parseQuery", () => {
    try {
      parseQuery(requestFor("?minSolved=9&maxSolved=2"), rankQuerySchema);
      throw new Error("expected parseQuery to throw");
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      const apiError = error as ApiError;
      expect(apiError.status).toBe(422);
      expect(apiError.code).toBe("VALIDATION_ERROR");
      expect(apiError.message).toBe("Invalid query parameters.");
      expect(apiError.details).toEqual([
        {
          path: "minSolved",
          message: "minSolved must be less than or equal to maxSolved.",
        },
      ]);
    }
  });
});

describe("ratingQuerySchema", () => {
  it("defaults pagination and sort", () => {
    expect(ratingQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 20,
      sort: "rating",
    });
  });

  it("accepts and normalises the full filter set", () => {
    const parsed = ratingQuerySchema.parse({
      page: "2",
      pageSize: "25",
      q: "  ada  ",
      institution: "  PrimeAsia University ",
      country: " Bangladesh ",
      minRating: "1500",
      maxRating: "2400",
      sort: "peak",
    });

    expect(parsed).toEqual({
      page: 2,
      pageSize: 25,
      q: "ada",
      institution: "PrimeAsia University",
      country: "Bangladesh",
      minRating: 1500,
      maxRating: 2400,
      sort: "peak",
    });
  });

  it("accepts every rating sort value", () => {
    for (const sort of ["rating", "peak", "contests", "name"] as const) {
      expect(ratingQuerySchema.parse({ sort }).sort).toBe(sort);
    }
  });

  it("treats blank numeric filters as unset instead of zero", () => {
    const parsed = ratingQuerySchema.parse({ minRating: "", maxRating: "  " });

    expect(parsed.minRating).toBeUndefined();
    expect(parsed.maxRating).toBeUndefined();
  });

  it("treats blank pagination and sort params as unset", () => {
    expect(
      ratingQuerySchema.parse({ page: "", pageSize: "  ", sort: "" }),
    ).toEqual({ page: 1, pageSize: 20, sort: "rating" });
  });

  it("rejects an unknown or points-only sort", () => {
    expect(ratingQuerySchema.safeParse({ sort: "points" }).success).toBe(false);
    expect(ratingQuerySchema.safeParse({ sort: "solved" }).success).toBe(false);
  });

  it("rejects minRating above maxRating", () => {
    const result = ratingQuerySchema.safeParse({
      minRating: "2000",
      maxRating: "1500",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toEqual(["minRating"]);
      expect(issue?.message).toContain(
        "minRating must be less than or equal to maxRating",
      );
    }
  });

  it("accepts equal rating bounds", () => {
    expect(
      ratingQuerySchema.parse({ minRating: "1500", maxRating: "1500" }).minRating,
    ).toBe(1500);
  });

  it("rejects out-of-range ratings", () => {
    expect(ratingQuerySchema.safeParse({ minRating: "-1" }).success).toBe(false);
    expect(ratingQuerySchema.safeParse({ maxRating: "10001" }).success).toBe(
      false,
    );
    expect(ratingQuerySchema.safeParse({ minRating: "2.5" }).success).toBe(false);
  });

  it("rejects over-long text filters", () => {
    expect(ratingQuerySchema.safeParse({ q: "a".repeat(101) }).success).toBe(false);
    expect(
      ratingQuerySchema.safeParse({ institution: "a".repeat(121) }).success,
    ).toBe(false);
    expect(
      ratingQuerySchema.safeParse({ country: "a".repeat(81) }).success,
    ).toBe(false);
  });

  it("surfaces the 422 ApiError shape from parseQuery", () => {
    try {
      parseQuery(
        {
          url: "http://localhost/api/v1/ratings?minRating=9&maxRating=2",
        } as unknown as NextRequest,
        ratingQuerySchema,
      );
      throw new Error("expected parseQuery to throw");
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      const apiError = error as ApiError;
      expect(apiError.status).toBe(422);
      expect(apiError.code).toBe("VALIDATION_ERROR");
      expect(apiError.message).toBe("Invalid query parameters.");
      expect(apiError.details).toEqual([
        {
          path: "minRating",
          message: "minRating must be less than or equal to maxRating.",
        },
      ]);
    }
  });
});
