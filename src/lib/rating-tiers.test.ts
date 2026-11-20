import { describe, expect, it } from "vitest";
import {
  getNextRatingTier,
  getRatingRunwayPercent,
  getRatingTier,
} from "./rating-tiers";

describe("getRatingTier", () => {
  it("keeps unrated users out of the rating ladder", () => {
    expect(getRatingTier(1500, false).key).toBe("unrated");
  });

  it("resolves every boundary", () => {
    expect(getRatingTier(1499).key).toBe("prospect");
    expect(getRatingTier(1500).key).toBe("contender");
    expect(getRatingTier(1600).key).toBe("specialist");
    expect(getRatingTier(1800).key).toBe("expert");
    expect(getRatingTier(2000).key).toBe("master");
    expect(getRatingTier(2200).key).toBe("grandmaster");
    expect(getRatingTier(2600).key).toBe("grandmaster");
  });

  it("finds the next tier and clamps the runway marker", () => {
    expect(getNextRatingTier(1599)?.key).toBe("specialist");
    expect(getNextRatingTier(2200)).toBeNull();
    expect(getRatingRunwayPercent(1000)).toBe(0);
    expect(getRatingRunwayPercent(1800)).toBe(50);
    expect(getRatingRunwayPercent(2600)).toBe(100);
  });
});
