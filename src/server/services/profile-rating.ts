import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { contestRatingChanges, users } from "@/server/db/schema";
import {
  buildRatingDistribution,
  type RatingBucket,
} from "@/lib/rating-distribution";

export type RatingRankStats = {
  ratingRank: number | null;
  ratedUserCount: number;
  ratingDistribution: RatingBucket[];
};

export async function getRatingRankStats(
  rating: number,
  hasRatingHistory: boolean,
): Promise<RatingRankStats> {
  const ratedRows = hasRatingHistory
    ? await getDb()
        .selectDistinct({ userId: users.id, rating: users.rating })
        .from(users)
        .innerJoin(
          contestRatingChanges,
          eq(users.id, contestRatingChanges.userId),
        )
        .where(eq(users.isBanned, false))
    : [];

  return {
    ratedUserCount: ratedRows.length,
    ratingRank: hasRatingHistory
      ? ratedRows.filter((row) => row.rating > rating).length + 1
      : null,
    ratingDistribution: buildRatingDistribution(
      ratedRows.map((row) => row.rating),
      rating,
    ),
  };
}
