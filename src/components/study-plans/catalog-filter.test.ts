import { describe, expect, it } from "vitest";
import type { StudyListSummary } from "@/lib/study-list-types";
import {
  applyCatalogFilters,
  filterStudyPlans,
  normalizeCatalogSort,
  normalizeLevelFilter,
  sortStudyPlans,
} from "./catalog-filter";

function plan(overrides: Partial<StudyListSummary>): StudyListSummary {
  return {
    id: overrides.slug ?? "id",
    slug: "plan",
    title: "Plan",
    description: "",
    level: "BEGINNER",
    isFeatured: false,
    estimatedMinutes: null,
    durationMinutes: 120,
    problemCount: 0,
    solvedCount: 0,
    attemptedCount: 0,
    progressPercent: 0,
    sectionCount: 1,
    difficultyCounts: { EASY: 0, MEDIUM: 0, HARD: 0, EXPERT: 0 },
    topics: [],
    enrolled: false,
    completed: false,
    nextProblem: null,
    isPublic: true,
    isOwned: false,
    ...overrides,
  };
}

const plans: StudyListSummary[] = [
  plan({
    slug: "arrays",
    title: "Array foundations",
    description: "Warm up with arrays.",
    level: "BEGINNER",
    durationMinutes: 90,
    progressPercent: 40,
    isFeatured: false,
    topics: ["Arrays", "Two Pointers"],
  }),
  plan({
    slug: "graphs",
    title: "Graph theory",
    description: "Traversal and shortest paths.",
    level: "ADVANCED",
    durationMinutes: 300,
    progressPercent: 80,
    isFeatured: true,
    topics: ["Graphs"],
  }),
  plan({
    slug: "dp",
    title: "Dynamic programming",
    description: "Classic DP patterns.",
    level: "INTERMEDIATE",
    durationMinutes: 180,
    progressPercent: 10,
    isFeatured: true,
  }),
];

describe("filterStudyPlans", () => {
  it("matches titles, descriptions and topics case-insensitively", () => {
    expect(
      filterStudyPlans(plans, { query: "two pointers", level: "all" }),
    ).toHaveLength(1);
    expect(
      filterStudyPlans(plans, { query: "SHORTEST", level: "all" }).map(
        (entry) => entry.slug,
      ),
    ).toEqual(["graphs"]);
  });

  it("filters by level and combines it with the query", () => {
    expect(
      filterStudyPlans(plans, { query: "", level: "ADVANCED" }).map(
        (entry) => entry.slug,
      ),
    ).toEqual(["graphs"]);
    expect(
      filterStudyPlans(plans, { query: "arrays", level: "ADVANCED" }),
    ).toHaveLength(0);
  });
});

describe("sortStudyPlans", () => {
  it("puts featured plans first for the recommended sort", () => {
    expect(sortStudyPlans(plans, "recommended").map((entry) => entry.slug)).toEqual([
      "dp",
      "graphs",
      "arrays",
    ]);
  });

  it("orders by duration and by progress", () => {
    expect(sortStudyPlans(plans, "shortest")[0]?.slug).toBe("arrays");
    expect(sortStudyPlans(plans, "progress")[0]?.slug).toBe("graphs");
    expect(sortStudyPlans(plans, "progress").at(-1)?.slug).toBe("dp");
  });
});

describe("applyCatalogFilters", () => {
  it("applies the full filter set without mutating the input", () => {
    const result = applyCatalogFilters(plans, {
      query: "",
      level: "all",
      sort: "shortest",
    });
    expect(result).toHaveLength(3);
    expect(plans[0]?.slug).toBe("arrays");
    expect(result.at(-1)?.slug).toBe("graphs");
  });
});

describe("normalizers", () => {
  it("falls back for unknown select values", () => {
    expect(normalizeLevelFilter("ADVANCED")).toBe("ADVANCED");
    expect(normalizeLevelFilter("bogus")).toBe("all");
    expect(normalizeCatalogSort("progress")).toBe("progress");
    expect(normalizeCatalogSort("bogus")).toBe("recommended");
  });
});
