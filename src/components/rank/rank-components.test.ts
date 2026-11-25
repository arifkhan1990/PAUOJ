import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { RatingRow } from "@/lib/rating-rank-types";
import type { RankRow } from "@/lib/types";
import { RankBoardTabs } from "./rank-board-tabs";
import { RankPagination } from "./rank-pagination";
import { RankPodium, type RankPodiumEntry } from "./rank-podium";
import { RankTable } from "./rank-table";
import { RatingTable } from "./rating-table";

function row(overrides: Partial<RankRow> & Pick<RankRow, "rank" | "username">): RankRow {
  return {
    displayName: overrides.username,
    institution: "BUET",
    country: "Bangladesh",
    points: 900 - overrides.rank,
    solvedCount: 100 - overrides.rank,
    submissionCount: 200,
    acceptanceRate: 62.5,
    lastAcceptedAt: null,
    presence: { state: "ONLINE", label: "Online now" },
    avatarPreset: null,
    avatarImageUpdatedAt: null,
    ...overrides,
  };
}

function podiumEntry(
  overrides: Partial<RankPodiumEntry> & Pick<RankPodiumEntry, "username" | "rank">,
): RankPodiumEntry {
  return {
    displayName: overrides.username,
    place: "BUET · Bangladesh",
    metricValue: "1200",
    metricUnit: "points",
    detail: null,
    ...overrides,
  };
}

function ratedRow(
  overrides: Partial<RatingRow> & Pick<RatingRow, "rank" | "username">,
): RatingRow {
  return {
    displayName: overrides.username,
    institution: "BUET",
    country: "Bangladesh",
    rating: 1820,
    maxRating: 1900,
    contestCount: 12,
    lastDelta: 24,
    lastContestAt: "2026-04-12T00:00:00.000Z",
    lastContestSlug: "spring-rated-2026",
    lastContestTitle: "Spring Rated 2026",
    presence: { state: "RECENT", label: "Last active 2d ago" },
    avatarPreset: null,
    avatarImageUpdatedAt: null,
    ...overrides,
  };
}

const topThreePoints: RankPodiumEntry[] = [
  podiumEntry({
    rank: 1,
    username: "coder1",
    displayName: "Coder One",
    metricValue: "1200",
    detail: createElement(
      "span",
      null,
      createElement("span", { className: "block" }, "140 solved"),
      createElement("span", { className: "block" }, "62.5% accepted"),
    ),
  }),
  podiumEntry({ rank: 2, username: "coder2", displayName: "Coder Two" }),
  podiumEntry({ rank: 3, username: "coder3", displayName: "Coder Three" }),
];

describe("RankPodium", () => {
  it("renders the three places with profile links and real stats", () => {
    const html = renderToStaticMarkup(
      createElement(RankPodium, { entries: topThreePoints }),
    );

    expect(html).toContain("Top coders");
    expect(html).toContain("1st");
    expect(html).toContain("2nd");
    expect(html).toContain("3rd");
    expect(html).toContain('href="/users/coder1"');
    expect(html).toContain('href="/users/coder2"');
    expect(html).toContain('href="/users/coder3"');
    expect(html).toContain("1200");
    expect(html).toContain("points");
    expect(html).toContain("BUET");
    expect(html).toContain("62.5% accepted");
  });

  it("labels a filtered board and marks the signed-in coder", () => {
    const html = renderToStaticMarkup(
      createElement(RankPodium, {
        entries: topThreePoints,
        filtered: true,
        currentUsername: "coder2",
      }),
    );

    expect(html).toContain("Top of this board");
    expect(html).toContain("You");
    expect(html).not.toContain("Top coders");
  });

  it("shows the global rank when filtered rows are not ranks 1–3", () => {
    const html = renderToStaticMarkup(
      createElement(RankPodium, {
        entries: topThreePoints.map((entry, index) => ({
          ...entry,
          rank: 7 + index,
        })),
        filtered: true,
      }),
    );

    expect(html).toContain("Rank #7");
    expect(html).toContain("Rank #8");
    expect(html).toContain("Rank #9");
  });

  it("renders nothing with fewer than three rows", () => {
    const html = renderToStaticMarkup(
      createElement(RankPodium, { entries: topThreePoints.slice(0, 2) }),
    );
    expect(html).toBe("");
  });

  it("supports a board-specific title and a rating tier badge", () => {
    const html = renderToStaticMarkup(
      createElement(RankPodium, {
        entries: topThreePoints.map((entry) => ({
          ...entry,
          metricUnit: "rating",
          metricValue: "1820",
          metricNote: createElement(
            "span",
            { className: "tier-badge" },
            "Expert",
          ),
          nameClassName: "text-amber-700",
          tierKey: "expert",
          detail: "Peak 1900 · 12 contests",
        })),
        title: "Top rated coders",
        description: "Highest rated",
        headingId: "rating-podium-heading",
      }),
    );

    expect(html).toContain("Top rated coders");
    expect(html).toContain("Highest rated");
    expect(html).toContain("1820");
    expect(html).toContain("Expert");
    expect(html).toContain("Peak 1900 · 12 contests");
    expect(html).toContain("rating-podium-heading");
    expect(html).toContain("text-amber-700");
    expect(html).toContain('data-tier="expert"');
    expect(html).toContain("hover:underline");
    expect(html).not.toContain("hover:text-primary");
  });
});

describe("RankBoardTabs", () => {
  it("marks the active board and links both boards", () => {
    const points = renderToStaticMarkup(
      createElement(RankBoardTabs, {
        active: "points",
        pointsHref: "/rank?pageSize=20",
        ratingHref: "/rank?board=rating&pageSize=20",
      }),
    );

    expect(points).toContain('aria-current="page"');
    expect(points.split('aria-current="page"')).toHaveLength(2);
    expect(points).toContain('href="/rank?pageSize=20"');
    expect(points).toContain('href="/rank?board=rating&amp;pageSize=20"');
    expect(points).toContain("Points");
    expect(points).toContain("Contest rating");
  });

  it("moves the current marker to the rating board", () => {
    const rating = renderToStaticMarkup(
      createElement(RankBoardTabs, {
        active: "rating",
        pointsHref: "/rank",
        ratingHref: "/rank?board=rating",
      }),
    );

    expect(rating).toContain('aria-current="page"');
    expect(rating.split('aria-current="page"')).toHaveLength(2);
  });
});

describe("RankTable", () => {
  const pageRows: RankRow[] = [
    row({ rank: 21, username: "coder21", displayName: "Coder Twenty One" }),
    row({ rank: 22, username: "coder22", displayName: "Coder Twenty Two" }),
  ];

  it("keeps global ranks, links and the acceptance bar", () => {
    const html = renderToStaticMarkup(
      createElement(RankTable, {
        items: pageRows,
        caption: "Global ranking, page 2 of 18",
      }),
    );

    expect(html).toContain("Global ranking, page 2 of 18");
    expect(html).toContain(">21<");
    expect(html).toContain(">22<");
    expect(html).toContain('href="/users/coder21"');
    expect(html).toContain("62.5%");
    expect(html).toContain("bg-success");
    expect(html).toContain("Online now");
    expect(html).not.toContain(">1<");
  });

  it("marks the current coder on both the table and mobile cards", () => {
    const html = renderToStaticMarkup(
      createElement(RankTable, {
        items: pageRows,
        currentUsername: "coder22",
      }),
    );

    expect(html.split('data-current="true"')).toHaveLength(3);
    expect(html.split("You")).toHaveLength(3);
  });

  it("does not mark anyone when signed out", () => {
    const html = renderToStaticMarkup(
      createElement(RankTable, { items: pageRows }),
    );

    expect(html).not.toContain('data-current="true"');
    expect(html).not.toContain(">You<");
  });
});

describe("RatingTable", () => {
  const pageRows: RatingRow[] = [
    ratedRow({
      rank: 21,
      username: "coder21",
      displayName: "Coder Twenty One",
      rating: 1820,
      maxRating: 1900,
      contestCount: 12,
      lastDelta: 24,
    }),
    ratedRow({
      rank: 22,
      username: "coder22",
      displayName: "Coder Twenty Two",
      rating: 1690,
      maxRating: 1710,
      contestCount: 7,
      lastDelta: -13,
      lastContestSlug: "autumn-rated-2025",
      lastContestTitle: "Autumn Rated 2025",
    }),
  ];

  it("keeps global ranks, rating, tier, peak, contests and signed deltas", () => {
    const html = renderToStaticMarkup(
      createElement(RatingTable, {
        items: pageRows,
        caption: "Global rating ranking, page 2 of 18",
      }),
    );

    expect(html).toContain("Global rating ranking, page 2 of 18");
    expect(html).toContain(">21<");
    expect(html).toContain(">22<");
    expect(html).toContain('href="/users/coder21"');
    expect(html).toContain("1820");
    expect(html).toContain("1900");
    expect(html).toContain("Expert");
    expect(html).toContain("Specialist");
    expect(html).toContain("+24");
    expect(html).toContain("−13");
    expect(html).toContain('href="/contests/spring-rated-2026"');
    expect(html).not.toContain(">1<");
    expect(html).toContain('data-tier="expert"');
    expect(html).toContain('data-tier="specialist"');
    expect(html).toContain("text-amber-700");
    expect(html).toContain("text-sky-700");
    expect(html).toContain("Last active 2d ago");
  });

  it("marks the current coder on both the table and mobile cards", () => {
    const html = renderToStaticMarkup(
      createElement(RatingTable, {
        items: pageRows,
        currentUsername: "coder22",
      }),
    );

    expect(html.split('data-current="true"')).toHaveLength(3);
    expect(html.split(">You<")).toHaveLength(3);
  });

  it("does not mark anyone when signed out", () => {
    const html = renderToStaticMarkup(
      createElement(RatingTable, { items: pageRows }),
    );

    expect(html).not.toContain('data-current="true"');
    expect(html).not.toContain(">You<");
  });
});

describe("RankPagination", () => {
  const searchParams = {
    q: "buet",
    institution: "BUET",
    sort: "solved",
    pageSize: "20",
  };

  it("shows the range, page window and filter-preserving links", () => {
    const html = renderToStaticMarkup(
      createElement(RankPagination, {
        searchParams,
        page: 2,
        pageSize: 20,
        total: 342,
      }),
    );

    expect(html).toContain("Showing");
    expect(html).toContain("21–40");
    expect(html).toContain("342");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(
      'href="/rank?q=buet&amp;institution=BUET&amp;sort=solved&amp;pageSize=20&amp;page=1"',
    );
    expect(html).toContain("page=3");
    expect(html).toContain(
      'href="/rank?q=buet&amp;institution=BUET&amp;sort=solved&amp;pageSize=20&amp;page=18"',
    );
  });

  it("preserves filters when changing the page size", () => {
    const html = renderToStaticMarkup(
      createElement(RankPagination, {
        searchParams,
        page: 2,
        pageSize: 20,
        total: 342,
      }),
    );

    expect(html).toContain('aria-current="true"');
    expect(html).toContain(
      'href="/rank?q=buet&amp;institution=BUET&amp;sort=solved&amp;pageSize=50&amp;page=1"',
    );
    expect(html).toContain(">10<");
    expect(html).toContain(">50<");
  });

  it("keeps the rating board in every pagination link", () => {
    const html = renderToStaticMarkup(
      createElement(RankPagination, {
        searchParams: { board: "rating", tier: "expert", pageSize: "20" },
        page: 2,
        pageSize: 20,
        total: 342,
      }),
    );

    expect(html).toContain(
      'href="/rank?board=rating&amp;tier=expert&amp;pageSize=20&amp;page=1"',
    );
    expect(html).toContain(
      'href="/rank?board=rating&amp;tier=expert&amp;pageSize=50&amp;page=1"',
    );
    expect(html).toContain(
      'href="/rank?board=rating&amp;tier=expert&amp;pageSize=20&amp;page=3"',
    );
  });

  it("disables first and previous on page one", () => {
    const html = renderToStaticMarkup(
      createElement(RankPagination, {
        searchParams,
        page: 1,
        pageSize: 20,
        total: 342,
      }),
    );

    expect(html.split('aria-disabled="true"')).toHaveLength(3);
    expect(html).toContain("First page");
    expect(html).toContain("Last page");
  });

  it("renders nothing without results", () => {
    const html = renderToStaticMarkup(
      createElement(RankPagination, {
        searchParams,
        page: 1,
        pageSize: 20,
        total: 0,
      }),
    );
    expect(html).toBe("");
  });
});
