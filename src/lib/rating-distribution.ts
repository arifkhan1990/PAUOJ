export type RatingBucket = {
  min: number;
  max: number;
  label: string;
  count: number;
  active: boolean;
};

const BUCKET_MIN = 1000;
const BUCKET_MAX = 2400;
const BUCKET_SIZE = 100;

export function buildRatingDistribution(
  ratings: number[],
  currentRating: number,
): RatingBucket[] {
  const regularBuckets = Math.ceil(
    (BUCKET_MAX - BUCKET_MIN) / BUCKET_SIZE,
  );
  const buckets: RatingBucket[] = Array.from(
    { length: regularBuckets + 1 },
    (_, index) => {
      const min = BUCKET_MIN + index * BUCKET_SIZE;
      const isLast = index === regularBuckets;
      return {
        min,
        max: isLast ? Number.POSITIVE_INFINITY : min + BUCKET_SIZE - 1,
        label: isLast ? `${BUCKET_MAX}+` : String(min),
        count: 0,
        active: false,
      };
    },
  );

  for (const rating of ratings) {
    const index =
      rating < BUCKET_MIN
        ? 0
        : rating >= BUCKET_MAX
          ? buckets.length - 1
          : Math.floor((rating - BUCKET_MIN) / BUCKET_SIZE);
    const bucket = buckets[index];
    if (bucket) bucket.count += 1;
  }

  for (const bucket of buckets) {
    bucket.active =
      currentRating >= bucket.min &&
      (bucket.max === Number.POSITIVE_INFINITY
        ? currentRating >= BUCKET_MAX
        : currentRating <= bucket.max);
  }

  return buckets;
}
