import { describe, expect, it } from "vitest";
import { buildRatingDistribution } from "./rating-distribution";

describe("buildRatingDistribution", () => {
  it("buckets ratings and marks the active bucket", () => {
    const buckets = buildRatingDistribution([1500, 1550, 1790, 2400], 1790);
    expect(buckets.find((bucket) => bucket.min === 1500)?.count).toBe(2);
    expect(buckets.find((bucket) => bucket.label === "2400+")?.count).toBe(1);
    expect(buckets.filter((bucket) => bucket.active)).toHaveLength(1);
    expect(buckets.find((bucket) => bucket.active)?.min).toBe(1700);
  });

  it("keeps out-of-range ratings in the edge buckets", () => {
    const buckets = buildRatingDistribution([900, 2600], 1500);
    expect(buckets[0]?.count).toBe(1);
    expect(buckets.at(-1)?.count).toBe(1);
  });
});
