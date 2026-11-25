import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RatingRow } from "@/lib/rating-rank-types";
import type { RankRow } from "@/lib/types";

vi.mock("@/server/services/rank", () => ({
  listRank: vi.fn(async () => ({ items: [], total: 0 })),
  listRankFacets: vi.fn(async () => ({
    institutions: [],
    countries: [],
    rankedCoders: 0,
  })),
  getUserRankStanding: vi.fn(async () => null),
}));

vi.mock("@/server/services/rating-rank", () => ({
  listRatingRank: vi.fn(async () => ({ items: [], total: 0 })),
  listRatingFacets: vi.fn(async () => ({
    institutions: [],
    countries: [],
    ratedCoders: 0,
  })),
  getUserRatingStanding: vi.fn(async () => null),
}));

import { PointsBoard } from "./points-board";
import { RatingBoard } from "./rating-board";
import { listRank, listRankFacets } from "@/server/services/rank";
import {
  getUserRatingStanding,
  listRatingFacets,
  listRatingRank,
} from "@/server/services/rating-rank";

const rankRow: RankRow = {
  rank: 1,
  username: "coder1",
  displayName: "Coder One",
  institution: "BUET",
  country: "Bangladesh",
  points: 1200,
  solvedCount: 140,
  submissionCount: 200,
  acceptanceRate: 62.5,
  lastAcceptedAt: null,
  presence: { state: "ONLINE", label: "Online now" },
  avatarPreset: null,
  avatarImageUpdatedAt: null,
};

const ratingRow: RatingRow = {
  rank: 1,
  username: "coder1",
  displayName: "Coder One",
  institution: "BUET",
  country: "Bangladesh",
  rating: 1820,
  maxRating: 1900,
  contestCount: 12,
  lastDelta: 24,
  lastContestAt: "2026-04-12T00:00:00.000Z",
  lastContestSlug: "spring-rated-2026",
  lastContestTitle: "Spring Rated 2026",
  presence: { state: "RECENT", label: "Last active 3h ago" },
  avatarPreset: null,
  avatarImageUpdatedAt: null,
};

async function renderPoints(params: Record<string, string> = {}) {
  return renderToStaticMarkup(
    await PointsBoard({ params: { pageSize: "20", ...params }, viewer: null }),
  );
}

async function renderRating(params: Record<string, string> = {}) {
  return renderToStaticMarkup(
    await RatingBoard({ params: { pageSize: "20", ...params }, viewer: null }),
  );
}

beforeEach(() => {
  vi.mocked(listRank).mockResolvedValue({ items: [], total: 0 });
  vi.mocked(listRankFacets).mockResolvedValue({
    institutions: [],
    countries: [],
    rankedCoders: 0,
  });
  vi.mocked(listRatingRank).mockResolvedValue({ items: [], total: 0 });
  vi.mocked(listRatingFacets).mockResolvedValue({
    institutions: [],
    countries: [],
    ratedCoders: 0,
  });
  vi.mocked(getUserRatingStanding).mockResolvedValue(null);
});

describe("PointsBoard", () => {
  it("keeps the practice empty state and the points explainer", async () => {
    const html = await renderPoints();

    expect(html).toContain("Ranked coders");
    expect(html).toContain("Nobody on the board yet");
    expect(html).toContain("How points work");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/reviewers"');
  });

  it("renders the points podium and table for ranked coders", async () => {
    vi.mocked(listRank).mockResolvedValue({
      items: [
        rankRow,
        { ...rankRow, rank: 2, username: "coder2", displayName: "Coder Two" },
        { ...rankRow, rank: 3, username: "coder3", displayName: "Coder Three" },
      ],
      total: 3,
    });
    vi.mocked(listRankFacets).mockResolvedValue({
      institutions: [{ value: "BUET", count: 3 }],
      countries: [],
      rankedCoders: 3,
    });

    const html = await renderPoints();

    expect(html).toContain("Top coders");
    expect(html).toContain("Coder One");
    expect(html).toContain("Global ranking, page 1 of 1");
    expect(html).toContain("62.5% accepted");
  });
});

describe("RatingBoard", () => {
  it("shows the rated empty state with a contests CTA", async () => {
    const html = await renderRating();

    expect(html).toContain("Rated coders");
    expect(html).toContain("No rated coders yet");
    expect(html).toContain("Browse contests");
    expect(html).toContain("How contest rating works");
    expect(html).toContain("K = 32");
    expect(html).toContain("GROUP contests do not change rating");
    expect(html).toContain('name="board" value="rating"');
    expect(html).toContain("Rating tier");
    expect(html).toContain("Any rating");
  });

  it("keeps the rating board in filter and tab links", async () => {
    const html = await renderRating({ tier: "expert", sort: "peak" });

    expect(html).toContain("/rank?board=rating");
    expect(html).toContain('href="/rank?board=rating&amp;pageSize=20"');
    expect(html).toContain('value="expert"');
    expect(html).toContain("Remove Rating: Expert");
  });

  it("renders the rating podium, table and global rank", async () => {
    vi.mocked(listRatingRank).mockResolvedValue({
      items: [
        ratingRow,
        { ...ratingRow, rank: 2, username: "coder2", displayName: "Coder Two" },
        { ...ratingRow, rank: 3, username: "coder3", displayName: "Coder Three" },
        { ...ratingRow, rank: 24, username: "coder24", displayName: "Coder 24" },
      ],
      total: 4,
    });
    vi.mocked(listRatingFacets).mockResolvedValue({
      institutions: [{ value: "BUET", count: 4 }],
      countries: [],
      ratedCoders: 4,
    });

    const html = await renderRating();

    expect(html).toContain("Top rated coders");
    expect(html).toContain("Peak 1900");
    expect(html).toContain("Expert");
    expect(html).toContain("+24");
    expect(html).toContain('href="/contests/spring-rated-2026"');
    expect(html).toContain("Global rating ranking, page 1 of 1");
    expect(html).toContain("href=\"/rank?board=rating&amp;pageSize=20");
    expect(html).toContain('data-tier="expert"');
    expect(html).toContain("text-amber-700");
  });

  it("uses singular contest copy for a one-contest standing", async () => {
    vi.mocked(getUserRatingStanding).mockResolvedValue({
      rank: 1,
      rating: 1900,
      maxRating: 1900,
      contestCount: 1,
    });

    const html = renderToStaticMarkup(
      await RatingBoard({
        params: { pageSize: "20" },
        viewer: { id: "user-1", username: "admin" },
      }),
    );

    expect(html).toContain("1 contest");
    expect(html).not.toContain("1 contests");
  });
});
