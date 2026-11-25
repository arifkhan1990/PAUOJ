import { describe, expect, it } from "vitest";
import { messageSuggestionQuerySchema } from "@/lib/schemas/messages";
import {
  contestSuggestionMeta,
  learningSuggestions,
  MESSAGE_SUGGESTION_LIMIT,
  problemSuggestion,
} from "./message-suggestions";

const MODULES = [
  {
    slug: "arrays",
    title: "Arrays & Hashing",
    titleBn: "অ্যারে ও হ্যাশিং",
    track: "core" as const,
    topics: [
      { slug: "two-pointers", title: "Two Pointers", titleBn: "দুই পয়েন্টার" },
      { slug: "sliding-window", title: "Sliding Window", titleBn: "স্লাইডিং উইন্ডো" },
    ],
  },
  {
    slug: "sql-basics",
    title: "SQL Basics",
    titleBn: "এসকিউএল বেসিক",
    track: "sql" as const,
    topics: [
      { slug: "select", title: "SELECT Queries", titleBn: "সিলেক্ট কোয়েরি" },
    ],
  },
];

describe("messageSuggestionQuerySchema", () => {
  it("accepts the three suggestion kinds", () => {
    for (const kind of ["contest", "problem", "learn"] as const) {
      expect(messageSuggestionQuerySchema.parse({ kind })).toEqual({ kind });
    }
  });

  it("rejects unknown kinds and oversized queries", () => {
    expect(
      messageSuggestionQuerySchema.safeParse({ kind: "user" }).success,
    ).toBe(false);
    expect(
      messageSuggestionQuerySchema.safeParse({ kind: "problem", q: "a".repeat(81) })
        .success,
    ).toBe(false);
  });

  it("trims the query", () => {
    expect(
      messageSuggestionQuerySchema.parse({ kind: "contest", q: "  cup  " }).q,
    ).toBe("cup");
  });
});

describe("contestSuggestionMeta", () => {
  const now = new Date("2026-11-25T12:00:00.000Z");

  it("labels live, upcoming, and ended contests", () => {
    expect(
      contestSuggestionMeta(
        new Date("2026-11-25T09:00:00.000Z"),
        new Date("2026-11-25T15:00:00.000Z"),
        now,
      ),
    ).toBe("Live now");
    expect(
      contestSuggestionMeta(
        new Date("2026-12-01T09:00:00.000Z"),
        new Date("2026-12-01T15:00:00.000Z"),
        now,
      ),
    ).toBe("Starts 01 Dec 2026");
    expect(
      contestSuggestionMeta(
        new Date("2026-11-20T09:00:00.000Z"),
        new Date("2026-11-20T15:00:00.000Z"),
        now,
      ),
    ).toBe("Ended 20 Nov 2026");
  });
});

describe("problemSuggestion", () => {
  it("uses the problem browser meta format", () => {
    expect(
      problemSuggestion({
        id: "problem-1",
        slug: "two-sum",
        title: "Two Sum",
        difficulty: "EASY",
        points: 100,
      }),
    ).toEqual({
      kind: "problem",
      id: "problem-1",
      label: "Two Sum",
      meta: "Easy · 100 pts",
      href: "/problems/two-sum",
    });
  });
});

describe("learningSuggestions", () => {
  it("returns up to 8 modules when the query is empty", () => {
    const items = learningSuggestions(MODULES, undefined);
    expect(items.map((item) => item.href)).toEqual([
      "/learn/arrays",
      "/learn/sql-basics",
    ]);
    expect(items[0]).toMatchObject({
      kind: "learn",
      label: "Arrays & Hashing",
      meta: "2 topics · Core",
    });
  });

  it("matches modules case-insensitively by title, Bangla title, or slug", () => {
    expect(learningSuggestions(MODULES, "sql")[0]?.href).toBe("/learn/sql-basics");
    expect(learningSuggestions(MODULES, "অ্যারে")[0]?.href).toBe("/learn/arrays");
    expect(learningSuggestions(MODULES, "ARRAYS")[0]?.href).toBe("/learn/arrays");
  });

  it("lists matching modules before matching topics", () => {
    const items = learningSuggestions(
      [
        {
          slug: "graphs",
          title: "Graphs",
          titleBn: "গ্রাফ",
          track: "core" as const,
          topics: [
            { slug: "graph-search", title: "Graph Search", titleBn: "গ্রাফ সার্চ" },
          ],
        },
      ],
      "graph",
    );
    expect(items.map((item) => item.href)).toEqual([
      "/learn/graphs",
      "/learn/graphs/graph-search",
    ]);
  });

  it("matches a module by slug without matching unrelated topics", () => {
    const items = learningSuggestions(MODULES, "sql");
    expect(items.map((item) => item.href)).toEqual(["/learn/sql-basics"]);
  });

  it("matches topics and links to the topic path", () => {
    const items = learningSuggestions(MODULES, "sliding");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      label: "Sliding Window",
      meta: "Arrays & Hashing",
      href: "/learn/arrays/sliding-window",
    });
  });

  it("never returns more than the 8-item cap", () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      slug: `module-${index}`,
      title: `Module ${index}`,
      titleBn: `মডিউল ${index}`,
      track: "core" as const,
      topics: [
        {
          slug: `topic-${index}`,
          title: `Topic ${index}`,
          titleBn: `টপিক ${index}`,
        },
      ],
    }));
    expect(learningSuggestions(many, "module")).toHaveLength(
      MESSAGE_SUGGESTION_LIMIT,
    );
    expect(learningSuggestions(many, undefined)).toHaveLength(
      MESSAGE_SUGGESTION_LIMIT,
    );
    expect(learningSuggestions(many, "topic")).toHaveLength(
      MESSAGE_SUGGESTION_LIMIT,
    );
  });

  it("returns an empty list when nothing matches", () => {
    expect(learningSuggestions(MODULES, "quantum")).toEqual([]);
  });
});
