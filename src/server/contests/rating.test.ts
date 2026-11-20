import { describe, expect, it } from "vitest";
import { compactRanks, computeRatingChanges } from "./rating";

describe("computeRatingChanges", () => {
  it("gives equal-rated players a symmetric swing", () => {
    const changes = computeRatingChanges([
      { userId: "a", rank: 1, rating: 1500 },
      { userId: "b", rank: 2, rating: 1500 },
    ]);
    expect(changes.find((change) => change.userId === "a")?.delta).toBe(16);
    expect(changes.find((change) => change.userId === "b")?.delta).toBe(-16);
  });

  it("rewards an upset more than a favourite's expected win", () => {
    const upset = computeRatingChanges([
      { userId: "a", rank: 1, rating: 1200 },
      { userId: "b", rank: 2, rating: 1800 },
    ]);
    const expected = computeRatingChanges([
      { userId: "a", rank: 1, rating: 1800 },
      { userId: "b", rank: 2, rating: 1200 },
    ]);
    expect(upset.find((change) => change.userId === "a")?.delta).toBeGreaterThan(
      20,
    );
    expect(
      expected.find((change) => change.userId === "a")?.delta,
    ).toBeLessThan(10);
  });

  it("never drops a rating below the floor", () => {
    const changes = computeRatingChanges([
      { userId: "a", rank: 2, rating: 100 },
      { userId: "b", rank: 1, rating: 3000 },
    ]);
    expect(changes.find((change) => change.userId === "a")?.newRating).toBe(
      100,
    );
  });

  it("keeps tied ranks on the same actual score", () => {
    const changes = computeRatingChanges([
      { userId: "a", rank: 1, rating: 1500 },
      { userId: "b", rank: 1, rating: 1500 },
      { userId: "c", rank: 3, rating: 1500 },
    ]);
    expect(changes[0]?.delta).toBe(changes[1]?.delta);
  });

  it("does nothing with fewer than two participants", () => {
    expect(
      computeRatingChanges([{ userId: "a", rank: 1, rating: 1500 }]),
    ).toEqual([]);
  });
});

describe("compactRanks", () => {
  it("closes gaps after filtering and preserves ties", () => {
    expect(
      compactRanks([
        { userId: "a", rank: 1 },
        { userId: "b", rank: 2 },
        { userId: "c", rank: 2 },
        { userId: "d", rank: 6 },
      ]),
    ).toEqual([
      { userId: "a", rank: 1 },
      { userId: "b", rank: 2 },
      { userId: "c", rank: 2 },
      { userId: "d", rank: 3 },
    ]);
  });
});
