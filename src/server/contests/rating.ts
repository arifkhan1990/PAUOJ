import type { RatingChangeResult, RatingParticipant } from "@/lib/rating-types";

export const RATING_K_FACTOR = 32;
export const MINIMUM_RATING = 100;

function expectedScore(player: number, opponent: number): number {
  return 1 / (1 + Math.pow(10, (opponent - player) / 400));
}

export function compactRanks(
  rows: { userId: string; rank: number }[],
): { userId: string; rank: number }[] {
  let previousOriginal: number | null = null;
  let previousRank = 0;
  return rows.map((row) => {
    const rank =
      previousOriginal !== null && row.rank === previousOriginal
        ? previousRank
        : previousRank + 1;
    previousOriginal = row.rank;
    previousRank = rank;
    return { userId: row.userId, rank };
  });
}

export function computeRatingChanges(
  participants: RatingParticipant[],
  kFactor = RATING_K_FACTOR,
): RatingChangeResult[] {
  const count = participants.length;
  if (count < 2) return [];

  const raw = participants.map((player) => {
    const expected =
      participants
        .filter((opponent) => opponent.userId !== player.userId)
        .reduce(
          (sum, opponent) => sum + expectedScore(player.rating, opponent.rating),
          0,
        ) / (count - 1);
    const actual = Math.min(
      1,
      Math.max(0, (count - player.rank) / (count - 1)),
    );
    return {
      player,
      exactDelta: kFactor * (actual - expected),
    };
  });
  const meanDelta =
    raw.reduce((sum, item) => sum + item.exactDelta, 0) / count;

  return raw.map(({ player, exactDelta }) => {
    const newRating = Math.max(
      MINIMUM_RATING,
      player.rating + Math.round(exactDelta - meanDelta),
    );
    return {
      userId: player.userId,
      rank: player.rank,
      oldRating: player.rating,
      newRating,
      delta: newRating - player.rating,
    };
  });
}
