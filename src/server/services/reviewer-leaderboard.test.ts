import { describe, expect, it } from "vitest";
import {
  parseReviewerRange,
  reviewerRangeStart,
} from "./reviewer-leaderboard";

const NOW = new Date("2026-11-21T12:00:00.000Z");

describe("parseReviewerRange", () => {
  it("keeps the supported numeric ranges", () => {
    expect(parseReviewerRange("7")).toBe("7");
    expect(parseReviewerRange("30")).toBe("30");
  });

  it("keeps the all range", () => {
    expect(parseReviewerRange("all")).toBe("all");
  });

  it("falls back to all for missing or unknown values", () => {
    expect(parseReviewerRange(undefined)).toBe("all");
    expect(parseReviewerRange("")).toBe("all");
    expect(parseReviewerRange("90")).toBe("all");
    expect(parseReviewerRange("7days")).toBe("all");
  });
});

describe("reviewerRangeStart", () => {
  it("returns no lower bound for the all range", () => {
    expect(reviewerRangeStart("all", NOW)).toBeNull();
  });

  it("subtracts exactly 7 days from the given now", () => {
    expect(reviewerRangeStart("7", NOW)?.toISOString()).toBe(
      "2026-11-14T12:00:00.000Z",
    );
  });

  it("subtracts exactly 30 days from the given now", () => {
    expect(reviewerRangeStart("30", NOW)?.toISOString()).toBe(
      "2026-10-22T12:00:00.000Z",
    );
  });

  it("does not mutate the supplied clock", () => {
    const now = new Date(NOW);
    reviewerRangeStart("30", now);
    expect(now.toISOString()).toBe("2026-11-21T12:00:00.000Z");
  });

  it("defaults to the current time", () => {
    const before = Date.now();
    const start = reviewerRangeStart("7");
    const after = Date.now();
    expect(start).not.toBeNull();
    const startMs = start!.getTime();
    expect(startMs).toBeGreaterThanOrEqual(before - 7 * 86_400_000);
    expect(startMs).toBeLessThanOrEqual(after - 7 * 86_400_000);
  });
});
