import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  activeRatingFilterCount,
  hasActiveRatingFilters,
  parseRankBoard,
  parseRatingFilters,
  parseRatingPageSize,
  parseRatingSort,
  parseRatingTier,
  RANK_BOARD_META,
  RATING_SORT_OPTIONS,
  rankBoardHref,
  rankBoardResetHref,
  rankSignInHref,
  ratingFilterChips,
  ratingSearchParams,
  ratingTierOptions,
  ratingTierRange,
  type RatingFilterState,
} from "./rating-rank";

const baseFilters: RatingFilterState = {
  q: "",
  institution: "",
  country: "",
  tier: "any",
  sort: "rating",
  pageSize: DEFAULT_PAGE_SIZE,
};

describe("parseRankBoard", () => {
  it("keeps the rating board and defaults everything else to points", () => {
    expect(parseRankBoard("rating")).toBe("rating");
    expect(parseRankBoard(" points ")).toBe("points");
    expect(parseRankBoard(["rating", "points"])).toBe("rating");
    expect(parseRankBoard(undefined)).toBe("points");
    expect(parseRankBoard("solved")).toBe("points");
  });
});

describe("parseRatingTier", () => {
  it("accepts every tier shown in the UI", () => {
    for (const tier of [
      "prospect",
      "contender",
      "specialist",
      "expert",
      "master",
      "grandmaster",
    ] as const) {
      expect(parseRatingTier(tier)).toBe(tier);
    }
  });

  it("falls back to any for absent, unrated or unknown values", () => {
    expect(parseRatingTier(undefined)).toBe("any");
    expect(parseRatingTier("")).toBe("any");
    expect(parseRatingTier("unrated")).toBe("any");
    expect(parseRatingTier("legend")).toBe("any");
    expect(parseRatingTier([" expert "])).toBe("expert");
  });
});

describe("parseRatingSort", () => {
  it("keeps supported sorts and defaults to rating", () => {
    expect(parseRatingSort("rating")).toBe("rating");
    expect(parseRatingSort("peak")).toBe("peak");
    expect(parseRatingSort("contests")).toBe("contests");
    expect(parseRatingSort("name")).toBe("name");
    expect(parseRatingSort(undefined)).toBe("rating");
    expect(parseRatingSort("points")).toBe("rating");
    expect(parseRatingSort("solved")).toBe("rating");
  });
});

describe("parseRatingPageSize", () => {
  it("only accepts 10, 20 and 50", () => {
    expect(parseRatingPageSize("10")).toBe(10);
    expect(parseRatingPageSize("50")).toBe(50);
    expect(parseRatingPageSize("30")).toBe(DEFAULT_PAGE_SIZE);
    expect(parseRatingPageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe("parseRatingFilters", () => {
  it("sanitises text, tier, sort and page size", () => {
    const filters = parseRatingFilters({
      q: "  faria  ",
      institution: " BUET ",
      country: " Bangladesh ",
      tier: "expert",
      sort: "peak",
      pageSize: "50",
    });

    expect(filters).toEqual({
      q: "faria",
      institution: "BUET",
      country: "Bangladesh",
      tier: "expert",
      sort: "peak",
      pageSize: 50,
    });
  });

  it("caps long text and drops invalid values", () => {
    const filters = parseRatingFilters({
      q: "x".repeat(300),
      institution: "y".repeat(300),
      country: "z".repeat(300),
      tier: "diamond",
      sort: "points",
      pageSize: "7",
    });

    expect(filters.q).toHaveLength(100);
    expect(filters.institution).toHaveLength(120);
    expect(filters.country).toHaveLength(80);
    expect(filters.tier).toBe("any");
    expect(filters.sort).toBe("rating");
    expect(filters.pageSize).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe("rating tier range and options", () => {
  it("maps tiers to inclusive rating bounds", () => {
    expect(ratingTierRange("any")).toEqual({});
    expect(ratingTierRange("prospect")).toEqual({
      minRating: 0,
      maxRating: 1499,
    });
    expect(ratingTierRange("contender")).toEqual({
      minRating: 1500,
      maxRating: 1599,
    });
    expect(ratingTierRange("grandmaster")).toEqual({ minRating: 2200 });
  });

  it("builds tier options from the shared tier list", () => {
    const options = ratingTierOptions();

    expect(options[0]).toEqual({ value: "", label: "Any rating" });
    expect(options.map((option) => option.value)).toEqual([
      "",
      "prospect",
      "contender",
      "specialist",
      "expert",
      "master",
      "grandmaster",
    ]);
    expect(options).toContainEqual({ value: "expert", label: "Expert" });
  });
});

describe("active rating filters", () => {
  it("counts text filters and a non-any tier", () => {
    expect(hasActiveRatingFilters(baseFilters)).toBe(false);
    expect(activeRatingFilterCount(baseFilters)).toBe(0);

    const filters = { ...baseFilters, q: "faria", tier: "expert" as const };
    expect(hasActiveRatingFilters(filters)).toBe(true);
    expect(activeRatingFilterCount(filters)).toBe(2);
  });

  it("does not treat sort or page size as filters", () => {
    const filters = { ...baseFilters, sort: "peak" as const, pageSize: 50 as const };
    expect(hasActiveRatingFilters(filters)).toBe(false);
    expect(activeRatingFilterCount(filters)).toBe(0);
  });
});

describe("ratingSearchParams", () => {
  it("always keeps the board and the page size", () => {
    expect(ratingSearchParams(baseFilters)).toEqual({
      board: "rating",
      pageSize: "20",
    });
  });

  it("keeps only non-default filters", () => {
    expect(
      ratingSearchParams({
        q: "faria",
        institution: "BUET",
        country: "Bangladesh",
        tier: "master",
        sort: "peak",
        pageSize: 50,
      }),
    ).toEqual({
      board: "rating",
      q: "faria",
      institution: "BUET",
      country: "Bangladesh",
      tier: "master",
      sort: "peak",
      pageSize: "50",
    });
  });
});

describe("ratingFilterChips", () => {
  it("removes one filter at a time and keeps the rest", () => {
    const filters: RatingFilterState = {
      q: "faria",
      institution: "BUET",
      country: "Bangladesh",
      tier: "expert",
      sort: "peak",
      pageSize: 20,
    };
    const chips = ratingFilterChips(filters);

    expect(chips.map((chip) => chip.key)).toEqual([
      "q",
      "institution",
      "country",
      "tier",
    ]);
    expect(chips.map((chip) => chip.label)).toContain("Rating: Expert");
    expect(chips[0]?.href).toBe(
      "/rank?board=rating&institution=BUET&country=Bangladesh&tier=expert&sort=peak&pageSize=20",
    );
    expect(chips[3]?.href).toBe(
      "/rank?board=rating&q=faria&institution=BUET&country=Bangladesh&sort=peak&pageSize=20",
    );
  });

  it("drops the page param so removing a filter starts at page one", () => {
    const chips = ratingFilterChips(
      { ...baseFilters, q: "faria" },
      { board: "rating", q: "faria", page: "3", pageSize: "20" },
    );
    expect(chips[0]?.href).toBe("/rank?board=rating&pageSize=20");
  });

  it("has no chips in the default state", () => {
    expect(ratingFilterChips(baseFilters)).toEqual([]);
  });
});

describe("rankBoardHref", () => {
  it("preserves only the shared filters and adds the board marker", () => {
    const searchParams = {
      q: "faria",
      institution: "BUET",
      country: "Bangladesh",
      pageSize: "50",
      sort: "peak",
      tier: "expert",
      solved: "51-100",
      page: "4",
    };

    expect(rankBoardHref("rating", searchParams)).toBe(
      "/rank?board=rating&q=faria&institution=BUET&country=Bangladesh&pageSize=50",
    );
    expect(rankBoardHref("points", searchParams)).toBe(
      "/rank?q=faria&institution=BUET&country=Bangladesh&pageSize=50",
    );
  });

  it("omits the board marker for points and handles empty input", () => {
    expect(rankBoardHref("points")).toBe("/rank");
    expect(rankBoardHref("rating")).toBe("/rank?board=rating");
    expect(rankBoardHref("points", { q: "  " })).toBe("/rank");
  });
});

describe("reset and sign-in hrefs", () => {
  it("keeps the rating board on reset", () => {
    expect(rankBoardResetHref("rating")).toBe("/rank?board=rating");
    expect(rankBoardResetHref("points")).toBe("/rank");
  });

  it("returns to the active board after sign in", () => {
    expect(rankSignInHref("points")).toBe("/login?next=%2Frank");
    expect(rankSignInHref("rating")).toBe(
      "/login?next=%2Frank%3Fboard%3Drating",
    );
  });
});

describe("RANK_BOARD_META", () => {
  it("gives each board distinct copy", () => {
    expect(RANK_BOARD_META.points.title).not.toBe(RANK_BOARD_META.rating.title);
    expect(RANK_BOARD_META.points.description).not.toBe(
      RANK_BOARD_META.rating.description,
    );
    expect(RANK_BOARD_META.rating.eyebrow).toBe("Contest rating");
  });
});

describe("sort options", () => {
  it("exposes four labelled sorts", () => {
    expect(RATING_SORT_OPTIONS.map((option) => option.value)).toEqual([
      "rating",
      "peak",
      "contests",
      "name",
    ]);
    expect(RATING_SORT_OPTIONS[0]?.label).toBe("Rating");
  });
});
