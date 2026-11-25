import { describe, expect, it } from "vitest";
import { compactRanks, computeRatingChanges } from "./rating";
import type { RatingParticipant } from "@/lib/rating-types";

/** Deterministic PRNG (mulberry32) so property tests never flake. */
function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ranks as a scoreboard produces them: sorted 1..count with ties. */
function scoreboardRanks(count: number, prng: () => number): number[] {
  const ranks: number[] = [];
  let rank = 0;
  let previous = 0;
  for (let position = 1; position <= count; position += 1) {
    const tied = previous > 0 && prng() < 0.2;
    rank = tied ? previous : position;
    previous = rank;
    ranks.push(rank);
  }
  return ranks;
}

function randomField(
  prng: () => number,
  options: { minRating: number; maxRating: number },
): RatingParticipant[] {
  const count = 2 + Math.floor(prng() * 24);
  const ranks = scoreboardRanks(count, prng);
  return Array.from({ length: count }, (_, index) => ({
    userId: `user-${index}`,
    rank: ranks[index],
    rating:
      options.minRating +
      Math.floor(prng() * (options.maxRating - options.minRating + 1)),
  }));
}

function sumOf(changes: { delta: number }[]): number {
  return changes.reduce((total, change) => total + change.delta, 0);
}

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

  it("gives the true last place a zero-sum tie split", () => {
    const changes = computeRatingChanges([
      { userId: "a", rank: 1, rating: 1500 },
      { userId: "b", rank: 1, rating: 1500 },
      { userId: "c", rank: 3, rating: 1500 },
    ]);
    expect(sumOf(changes)).toBe(0);
    expect(changes.map((change) => change.delta)).toEqual([11, 11, -22]);
  });

  it("never splits a tie group to chase an exact sum", () => {
    const changes = computeRatingChanges([
      { userId: "a", rank: 1, rating: 1254 },
      { userId: "b", rank: 1, rating: 1254 },
      { userId: "c", rank: 3, rating: 2797 },
    ]);
    // The whole tie group takes the spare point together (19, 19) instead
    // of one member getting it; the strong outsider absorbs the rest.
    expect(changes.map((change) => change.delta)).toEqual([19, 19, -38]);
    expect(sumOf(changes)).toBe(0);
  });

  it("absorbs a floor hit from the winners' gains", () => {
    const changes = computeRatingChanges([
      { userId: "a", rank: 1, rating: 105 },
      { userId: "b", rank: 2, rating: 105 },
      { userId: "c", rank: 3, rating: 105 },
      { userId: "d", rank: 4, rating: 105 },
    ]);
    expect(sumOf(changes)).toBe(0);
    expect(changes.map((change) => change.delta)).toEqual([8, 2, -5, -5]);
    expect(changes[2]?.newRating).toBe(100);
    expect(changes[3]?.newRating).toBe(100);
  });

  it("gives up zero-sum only when every gain is spent on the floor", () => {
    const changes = computeRatingChanges([
      { userId: "a", rank: 1, rating: 1500 },
      { userId: "b", rank: 2, rating: 100 },
      { userId: "c", rank: 3, rating: 100 },
    ]);
    expect(changes.map((change) => change.delta)).toEqual([0, 0, 0]);
    expect(sumOf(changes)).toBe(0);
  });
});

describe("computeRatingChanges properties", () => {
  const FIELDS = 300;

  it("keeps tie-free deltas exactly zero-sum away from the floor", () => {
    const prng = createPrng(0x5eed);
    for (let run = 0; run < FIELDS; run += 1) {
      const count = 2 + Math.floor(prng() * 24);
      const field: RatingParticipant[] = Array.from(
        { length: count },
        (_, index) => ({
          userId: `user-${index}`,
          rank: index + 1,
          rating: 200 + Math.floor(prng() * 2800),
        }),
      );
      // Without ties every group is a singleton, so the whole-group
      // rounding always composes the remainder exactly.
      expect(sumOf(computeRatingChanges(field))).toBe(0);
    }
  });

  it("keeps tie symmetry and at most a tiny residual with ties", () => {
    const prng = createPrng(0x71e5);
    for (let run = 0; run < FIELDS; run += 1) {
      const count = 2 + Math.floor(prng() * 24);
      const ranks = scoreboardRanks(count, prng);
      const ratingByRank = new Map<number, number>();
      const field: RatingParticipant[] = ranks.map((rank, index) => {
        let rating = ratingByRank.get(rank);
        if (rating === undefined) {
          rating = 200 + Math.floor(prng() * 2800);
          ratingByRank.set(rank, rating);
        }
        return { userId: `user-${index}`, rank, rating };
      });
      const changes = computeRatingChanges(field);
      // Same rank and rating always means the same delta.
      const byRank = new Map<number, number>();
      for (const change of changes) {
        const seen = byRank.get(change.rank);
        if (seen !== undefined) expect(change.delta).toBe(seen);
        else byRank.set(change.rank, change.delta);
      }
      // Zero-sum holds unless no whole tie-group combination composes the
      // remainder; the residual is then bounded by that group-size gap.
      const sum = sumOf(changes);
      expect(Math.abs(sum)).toBeLessThanOrEqual(4);
    }
  });

  it("respects the floor and keeps sums near zero around it", () => {
    const prng = createPrng(0xf100);
    for (let run = 0; run < FIELDS; run += 1) {
      const field = randomField(prng, { minRating: 100, maxRating: 3000 });
      const changes = computeRatingChanges(field);
      for (const change of changes) {
        expect(change.newRating).toBeGreaterThanOrEqual(100);
        // Tied ranks spread the tie bias, so a swing can reach 2k + 1.
        expect(Math.abs(change.delta)).toBeLessThanOrEqual(65);
      }
      const sum = sumOf(changes);
      // Floor hits are paid for by the gains. The sum only grows large and
      // positive when every gain is already spent keeping losers at the
      // floor; rounding residuals stay within a few points of zero.
      expect(
        sum >= -8 && (sum <= 8 || changes.every((c) => c.delta <= 0)),
      ).toBe(true);
    }
  });

  it("is deterministic for identical input", () => {
    const prng = createPrng(0xde17a >>> 0);
    for (let run = 0; run < 50; run += 1) {
      const field = randomField(prng, { minRating: 100, maxRating: 3000 });
      expect(computeRatingChanges(field)).toEqual(computeRatingChanges(field));
    }
  });
});

describe("compactRanks", () => {
  it("closes gaps after filtering and preserves ties as competition ranks", () => {
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
      { userId: "d", rank: 4 },
    ]);
  });

  it("keeps already-compact ties untouched", () => {
    expect(
      compactRanks([
        { userId: "a", rank: 1 },
        { userId: "b", rank: 1 },
        { userId: "c", rank: 3 },
      ]),
    ).toEqual([
      { userId: "a", rank: 1 },
      { userId: "b", rank: 1 },
      { userId: "c", rank: 3 },
    ]);
  });

  it("always produces competition ranks for random filtered scoreboards", () => {
    const prng = createPrng(0xc0ffee);
    for (let run = 0; run < 200; run += 1) {
      const ranks = scoreboardRanks(2 + Math.floor(prng() * 30), prng);
      const rows = ranks.map((rank, index) => ({
        userId: `user-${index}`,
        rank,
      }));
      const compacted = compactRanks(rows);
      for (const row of compacted) {
        const better = rows.filter((other) => other.rank < row.rank).length;
        expect(row.rank).toBe(better + 1);
      }
      for (const row of compacted) {
        const twins = rows.filter((other) => other.rank === row.rank).length;
        expect(
          compacted.filter((other) => other.rank === row.rank).length,
        ).toBe(twins);
      }
    }
  });
});
