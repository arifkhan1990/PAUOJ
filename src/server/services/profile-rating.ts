import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { contestRatingChanges, users } from "@/server/db/schema";
import {
  buildRatingDistribution,
  type RatingBucket,
} from "@/lib/rating-distribution";
import { getUserRatingStanding } from "./rating-rank";

export type RatingRankStats = {
  ratingRank: number | null;
  ratedUserCount: number;
  ratingDistribution: RatingBucket[];
};

/**
 * Profile rating stats. The rank comes from the rating board window, so a
 * profile rank always matches the same coder's row on `/rank`; the
 * distribution and count keep their existing values.
 */
export async function getRatingRankStats(
  userId: string,
  hasRatingHistory: boolean,
): Promise<RatingRankStats> {
  const db = getDb();
  const [userRow] = await db
    .select({ rating: users.rating })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const rating = userRow?.rating ?? 1500;

  const [ratedRows, standing] = await Promise.all([
    hasRatingHistory
      ? db
          .selectDistinct({ userId: users.id, rating: users.rating })
          .from(users)
          .innerJoin(
            contestRatingChanges,
            eq(users.id, contestRatingChanges.userId),
          )
          .where(eq(users.isBanned, false))
      : Promise.resolve([]),
    hasRatingHistory ? getUserRatingStanding(userId) : Promise.resolve(null),
  ]);

  return {
    ratedUserCount: ratedRows.length,
    ratingRank: standing?.rank ?? null,
    ratingDistribution: buildRatingDistribution(
      ratedRows.map((row) => row.rating),
      rating,
    ),
  };
}
