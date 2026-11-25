import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  activeRankFilterCount,
  facetSelectOptions,
  hasActiveRankFilters,
  parseRankFilters,
  parseRankPageSize,
  parseRankSort,
  parseSolvedBracket,
  rankFilterChips,
  rankResultRange,
  rankSearchParams,
  solvedRange,
} from "./rank-filters";

describe("parseSolvedBracket", () => {
  it("accepts every bracket in the UI", () => {
    for (const bracket of ["any", "1-10", "11-50", "51-100", "100+"] as const) {
      expect(parseSolvedBracket(bracket)).toBe(bracket);
    }
  });

  it("trims input and reads the first array value", () => {
    expect(parseSolvedBracket("  51-100 ")).toBe("51-100");
    expect(parseSolvedBracket(["11-50", "1-10"])).toBe("11-50");
  });

  it("falls back to any for absent or invalid values", () => {
    expect(parseSolvedBracket(undefined)).toBe("any");
    expect(parseSolvedBracket("")).toBe("any");
    expect(parseSolvedBracket("99-200")).toBe("any");
    expect(parseSolvedBracket("100")).toBe("any");
  });
});

describe("solvedRange", () => {
  it("maps brackets to inclusive bounds", () => {
    expect(solvedRange("any")).toEqual({});
    expect(solvedRange("1-10")).toEqual({ minSolved: 1, maxSolved: 10 });
    expect(solvedRange("11-50")).toEqual({ minSolved: 11, maxSolved: 50 });
    expect(solvedRange("51-100")).toEqual({ minSolved: 51, maxSolved: 100 });
    expect(solvedRange("100+")).toEqual({ minSolved: 100 });
  });
});

describe("parseRankSort", () => {
  it("keeps supported sort values", () => {
    expect(parseRankSort("points")).toBe("points");
    expect(parseRankSort("solved")).toBe("solved");
    expect(parseRankSort("name")).toBe("name");
  });

  it("defaults to points", () => {
    expect(parseRankSort(undefined)).toBe("points");
    expect(parseRankSort("rating")).toBe("points");
  });
});

describe("parseRankPageSize", () => {
  it("only accepts 10, 20 and 50", () => {
    expect(parseRankPageSize("10")).toBe(10);
    expect(parseRankPageSize("20")).toBe(20);
    expect(parseRankPageSize("50")).toBe(50);
    expect(parseRankPageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(parseRankPageSize("30")).toBe(DEFAULT_PAGE_SIZE);
    expect(parseRankPageSize("abc")).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe("parseRankFilters", () => {
  it("sanitises text, sort, solved and page size", () => {
    const filters = parseRankFilters({
      q: "  buet  ",
      institution: " BUET ",
      country: " Bangladesh ",
      solved: "11-50",
      sort: "solved",
      pageSize: "50",
    });

    expect(filters).toEqual({
      q: "buet",
      institution: "BUET",
      country: "Bangladesh",
      solved: "11-50",
      sort: "solved",
      pageSize: 50,
    });
  });

  it("caps the query and drops invalid params safely", () => {
    const filters = parseRankFilters({
      q: "x".repeat(150),
      solved: "nope",
      sort: "nope",
      pageSize: "999",
    });

    expect(filters.q).toHaveLength(100);
    expect(filters.solved).toBe("any");
    expect(filters.sort).toBe("points");
    expect(filters.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(filters.institution).toBe("");
    expect(filters.country).toBe("");
  });
});

describe("active filters", () => {
  const base = parseRankFilters({});

  it("counts text filters and a non-any solved bracket", () => {
    expect(hasActiveRankFilters(base)).toBe(false);
    expect(activeRankFilterCount(base)).toBe(0);

    const active = parseRankFilters({
      q: "a",
      institution: "BUET",
      country: "Bangladesh",
      solved: "51-100",
    });
    expect(hasActiveRankFilters(active)).toBe(true);
    expect(activeRankFilterCount(active)).toBe(4);
  });

  it("does not treat sort or page size as filters", () => {
    const state = parseRankFilters({ sort: "name", pageSize: "50" });
    expect(hasActiveRankFilters(state)).toBe(false);
    expect(activeRankFilterCount(state)).toBe(0);
  });
});

describe("rankSearchParams", () => {
  it("keeps only non-default params plus the page size", () => {
    expect(rankSearchParams(parseRankFilters({}))).toEqual({ pageSize: "20" });

    expect(
      rankSearchParams(
        parseRankFilters({
          q: "buet",
          solved: "1-10",
          sort: "name",
          pageSize: "50",
        }),
      ),
    ).toEqual({
      q: "buet",
      solved: "1-10",
      sort: "name",
      pageSize: "50",
    });
  });
});

describe("rankFilterChips", () => {
  it("removes one filter at a time and preserves the rest", () => {
    const filters = parseRankFilters({
      q: "buet",
      institution: "BUET",
      country: "Bangladesh",
      solved: "11-50",
      sort: "solved",
      pageSize: "50",
    });
    const chips = rankFilterChips(filters);

    expect(chips.map((chip) => chip.key)).toEqual([
      "q",
      "institution",
      "country",
      "solved",
    ]);
    expect(chips[0]?.label).toBe("Search: buet");
    expect(chips[0]?.href).toBe(
      "/rank?institution=BUET&country=Bangladesh&solved=11-50&sort=solved&pageSize=50",
    );
    expect(chips[3]?.label).toBe("11–50 solved");
    expect(chips[3]?.href).toBe(
      "/rank?q=buet&institution=BUET&country=Bangladesh&sort=solved&pageSize=50",
    );
  });

  it("drops the page param so removing a filter starts at page one", () => {
    const filters = parseRankFilters({ q: "buet" });
    const chips = rankFilterChips(filters, {
      q: "buet",
      pageSize: "20",
      page: "3",
    });

    expect(chips[0]?.href).toBe("/rank?pageSize=20");
    expect(chips[0]?.href).not.toContain("page=");
  });

  it("has no chips for the default state", () => {
    expect(rankFilterChips(parseRankFilters({}))).toEqual([]);
  });
});

describe("facetSelectOptions", () => {
  it("adds an all option, count labels and the active out-of-window value", () => {
    const options = facetSelectOptions(
      [
        { value: "BUET", count: 12 },
        { value: "DU", count: 8 },
      ],
      "All institutions",
      "NSU",
    );

    expect(options).toEqual([
      { value: "", label: "All institutions" },
      { value: "BUET", label: "BUET (12)" },
      { value: "DU", label: "DU (8)" },
      { value: "NSU", label: "NSU" },
    ]);
  });

  it("does not duplicate the active value or empty facet values", () => {
    const options = facetSelectOptions(
      [
        { value: "", count: 4 },
        { value: "BUET", count: 12 },
        { value: "BUET", count: 12 },
      ],
      "All countries",
      "BUET",
    );

    expect(options).toEqual([
      { value: "", label: "All countries" },
      { value: "BUET", label: "BUET (12)" },
    ]);
  });
});

describe("rankResultRange", () => {
  it("uses a 1-based inclusive range", () => {
    expect(rankResultRange(1, 20, 342)).toEqual({ from: 1, to: 20 });
    expect(rankResultRange(2, 20, 342)).toEqual({ from: 21, to: 40 });
    expect(rankResultRange(18, 20, 342)).toEqual({ from: 341, to: 342 });
    expect(rankResultRange(1, 20, 0)).toEqual({ from: 0, to: 0 });
  });
});
