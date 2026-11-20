export type RatedContestSeedDefinition = {
  slug: string;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  problemSlugs: string[];
};

export function ratedContestSeedDefinitions(
  now: number,
): RatedContestSeedDefinition[] {
  return [
    {
      slug: "pau-autumn-2026",
      title: "PAU Autumn Sprint",
      description:
        "The first rated round of the season: arrays, primes and bracket matching. The contest has ended, but the problems stay open for practice.",
      startAt: new Date(now - 68 * 24 * 60 * 60 * 1000),
      endAt: new Date(now - 67 * 24 * 60 * 60 * 1000),
      problemSlugs: ["reverse-array", "prime-counter", "balanced-brackets"],
    },
    {
      slug: "pau-winter-2026",
      title: "PAU Winter Warm-up",
      description:
        "A rated warm-up around matrices, subsequences and shortest paths. The contest has ended, but the problems stay open for practice.",
      startAt: new Date(now - 52 * 24 * 60 * 60 * 1000),
      endAt: new Date(now - 51 * 24 * 60 * 60 * 1000),
      problemSlugs: [
        "matrix-multiplication",
        "longest-increasing-subsequence",
        "shortest-path",
      ],
    },
    {
      slug: "pau-spring-2026",
      title: "PAU Spring Practice Round",
      description:
        "A relaxed practice round covering arrays, matrices and dynamic programming. The contest has ended, but you can still solve the problems.",
      startAt: new Date(now - 30 * 24 * 60 * 60 * 1000),
      endAt: new Date(now - 29 * 24 * 60 * 60 * 1000),
      problemSlugs: [
        "reverse-array",
        "matrix-multiplication",
        "longest-increasing-subsequence",
      ],
    },
  ];
}
