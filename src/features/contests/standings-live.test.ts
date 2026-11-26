import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ContestScoreboard } from "@/lib/types";
import {
  formatStandingsAge,
  standingsRange,
  StandingsLive,
} from "./standings-live";

const GENERATED = "2026-11-26T10:00:00.000Z";

function at(secondsAfterGeneration: number): string {
  return formatStandingsAge(
    GENERATED,
    Date.parse(GENERATED) + secondsAfterGeneration * 1000,
  );
}

describe("formatStandingsAge", () => {
  it("shows 'just now' for the first seconds", () => {
    expect(at(0)).toBe("Updated just now");
    expect(at(9)).toBe("Updated just now");
  });

  it("shows seconds, minutes and hours with correct plural units", () => {
    expect(at(10)).toBe("Updated 10s ago");
    expect(at(59)).toBe("Updated 59s ago");
    expect(at(60)).toBe("Updated 1 min ago");
    expect(at(300)).toBe("Updated 5 min ago");
    expect(at(3600)).toBe("Updated 1 h ago");
    expect(at(7200)).toBe("Updated 2 h ago");
  });

  it("clamps clock skew instead of showing a negative age", () => {
    expect(at(-30)).toBe("Updated just now");
  });

  it("falls back for an unparseable timestamp", () => {
    expect(formatStandingsAge("not-a-date", Date.now())).toBe(
      "Updated moments ago",
    );
  });
});

describe("standingsRange", () => {
  it("returns the inclusive rank window for a full page", () => {
    expect(standingsRange(1, 100, 10_000)).toEqual({ start: 1, end: 100 });
    expect(standingsRange(2, 100, 10_000)).toEqual({ start: 101, end: 200 });
  });

  it("clamps the last partial page to the total", () => {
    expect(standingsRange(100, 100, 9_950)).toEqual({
      start: 9_901,
      end: 9_950,
    });
  });

  it("returns null for empty boards or pages past the end", () => {
    expect(standingsRange(1, 100, 0)).toBeNull();
    expect(standingsRange(101, 100, 10_000)).toBeNull();
    expect(standingsRange(1, 0, 10)).toBeNull();
  });
});

function boardFixture(): ContestScoreboard {
  return {
    contest: {
      slug: "live-cup",
      title: "Live Cup",
      startAt: "2026-11-26T09:00:00.000Z",
      endAt: "2026-11-26T12:00:00.000Z",
      status: "RUNNING",
      freezeMinutes: 0,
      format: "SINGLE",
      teamSize: 1,
      ratingFinalizedAt: null,
      ratingReviewEndsAt: "2026-11-26T13:00:00.000Z",
    },
    frozen: false,
    freezeAt: null,
    labels: ["A"],
    generatedAt: "2026-11-26T10:00:00.000Z",
    pagination: { page: 2, pageSize: 100, total: 10_000, totalPages: 100 },
    rows: [
      {
        rank: 101,
        user: { username: "coder101", displayName: "Coder 101" },
        team: null,
        solved: 1,
        penalty: 12,
        problems: {
          A: { solved: true, attempts: 0, solveTimeMinutes: 12, firstBlood: false },
        },
      },
    ],
  };
}

describe("StandingsLive", () => {
  it("renders only the served page and links pagination to the standings route", () => {
    const html = renderToStaticMarkup(
      createElement(StandingsLive, {
        slug: "live-cup",
        initialBoard: boardFixture(),
      }),
    );

    expect(html).toContain("Showing 101–200 of 10,000");
    expect(html).toContain('href="/contests/live-cup/standings?page=1"');
    expect(html).toContain('href="/contests/live-cup/standings?page=3"');
    expect(html).toContain('href="/contests/live-cup/standings?page=100"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Coder 101");
    expect(html).toContain("Updated just now");
    expect(html).not.toContain("Coder 102");
  });

  it("renders a light shell when the first rows are deferred", () => {
    const html = renderToStaticMarkup(
      createElement(StandingsLive, {
        slug: "live-cup",
        initialBoard: { ...boardFixture(), rows: [] },
        deferInitialRows: true,
      }),
    );

    expect(html).toContain("Loading live standings…");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Showing 101–200");
    expect(html).not.toContain("Coder 101");
  });
});

