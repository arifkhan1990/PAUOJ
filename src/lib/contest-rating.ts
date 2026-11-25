/**
 * Contest ratings are finalised one hour after the contest ends. That hour is a
 * review/rejudge window: rejudges are still allowed and the finalizer waits for
 * every contest submission to settle before applying rating changes.
 */
export const RATING_REVIEW_WINDOW_MS = 60 * 60 * 1000;

/** When the review window closes and ratings become finalisable. */
export function ratingReviewEndsAt(endAt: Date): Date {
  return new Date(endAt.getTime() + RATING_REVIEW_WINDOW_MS);
}

/**
 * True while rejudges are still reflected in the scoreboard. The window closes
 * exactly at endAt + 1 hour, so `now === ratingReviewEndsAt(endAt)` is closed.
 */
export function isRatingReviewOpen(
  endAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() < ratingReviewEndsAt(endAt).getTime();
}

export function ratingReviewEndsAtIso(endAt: Date): string {
  return ratingReviewEndsAt(endAt).toISOString();
}

/** Once `rated_at` is set the contest rating table is immutable. */
export function isContestRatingLocked(ratedAt: Date | null): boolean {
  return ratedAt !== null;
}

export type ContestStructureSnapshot = {
  startAt: Date;
  endAt: Date;
  format: string;
  division: string;
};

export type ContestStructureChanges = {
  /** Problems were added, removed or reordered. */
  problemSet: boolean;
  /** Start or end time changed. */
  schedule: boolean;
  /** Format (solo/team) or division changed. */
  formatOrDivision: boolean;
};

export function contestStructureChanges(
  current: ContestStructureSnapshot,
  next: ContestStructureSnapshot,
  problemSetChanged: boolean,
): ContestStructureChanges {
  return {
    problemSet: problemSetChanged,
    schedule:
      current.startAt.getTime() !== next.startAt.getTime() ||
      current.endAt.getTime() !== next.endAt.getTime(),
    formatOrDivision:
      current.format !== next.format || current.division !== next.division,
  };
}

/**
 * A contest whose ratings are finalised keeps its problems and schedule frozen.
 * Descriptive metadata (title, description, banner, rules, prizes, eligibility)
 * stays editable because it does not affect the rated field.
 */
export function isContestStructureLocked(
  ratedAt: Date | null,
  changes: ContestStructureChanges,
): boolean {
  if (!isContestRatingLocked(ratedAt)) return false;
  return changes.problemSet || changes.schedule || changes.formatOrDivision;
}
