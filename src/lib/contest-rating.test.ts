import { describe, expect, it } from "vitest";
import {
  RATING_REVIEW_WINDOW_MS,
  contestStructureChanges,
  isContestRatingLocked,
  isContestStructureLocked,
  isRatingReviewOpen,
  ratingReviewEndsAt,
  ratingReviewEndsAtIso,
} from "./contest-rating";

const END = new Date("2026-11-25T12:00:00.000Z");

describe("contest rating review window", () => {
  it("is exactly one hour", () => {
    expect(RATING_REVIEW_WINDOW_MS).toBe(3_600_000);
    expect(ratingReviewEndsAt(END).toISOString()).toBe(
      "2026-11-25T13:00:00.000Z",
    );
  });

  it("stays open at 59:59 and closes at 60:00", () => {
    const open = new Date(END.getTime() + 59 * 60_000 + 59_000);
    const closed = new Date(END.getTime() + 60 * 60_000);
    expect(isRatingReviewOpen(END, open)).toBe(true);
    expect(isRatingReviewOpen(END, closed)).toBe(false);
    expect(isRatingReviewOpen(END, new Date(END.getTime() + 3_600_001))).toBe(
      false,
    );
  });

  it("uses the current time by default", () => {
    expect(isRatingReviewOpen(new Date(Date.now() - 2 * 60 * 60_000))).toBe(
      false,
    );
    expect(isRatingReviewOpen(new Date(Date.now() - 30 * 60_000))).toBe(true);
  });

  it("returns an ISO timestamp for the review deadline", () => {
    expect(ratingReviewEndsAtIso(END)).toBe("2026-11-25T13:00:00.000Z");
  });
});

describe("contest rating lock", () => {
  it("is unlocked until ratedAt is set", () => {
    expect(isContestRatingLocked(null)).toBe(false);
    expect(isContestRatingLocked(new Date())).toBe(true);
  });

  it("only freezes structure once ratings exist", () => {
    const changed = {
      problemSet: true,
      schedule: true,
      formatOrDivision: true,
    };
    expect(isContestStructureLocked(null, changed)).toBe(false);
    expect(
      isContestStructureLocked(END, {
        problemSet: false,
        schedule: false,
        formatOrDivision: false,
      }),
    ).toBe(false);
    expect(isContestStructureLocked(END, { ...changed, problemSet: false })).toBe(
      true,
    );
    expect(isContestStructureLocked(END, { ...changed, schedule: false })).toBe(
      true,
    );
    expect(
      isContestStructureLocked(END, { ...changed, formatOrDivision: false }),
    ).toBe(true);
  });

  it("detects schedule, format, division and problem-set changes", () => {
    const current = {
      startAt: END,
      endAt: new Date(END.getTime() + 7_200_000),
      format: "SINGLE",
      division: "OPEN",
    };
    expect(contestStructureChanges(current, current, false)).toEqual({
      problemSet: false,
      schedule: false,
      formatOrDivision: false,
    });
    expect(
      contestStructureChanges(
        current,
        { ...current, endAt: new Date(current.endAt.getTime() + 60_000) },
        false,
      ).schedule,
    ).toBe(true);
    expect(
      contestStructureChanges(current, { ...current, format: "GROUP" }, false)
        .formatOrDivision,
    ).toBe(true);
    expect(
      contestStructureChanges(current, { ...current, division: "DIV1" }, false)
        .formatOrDivision,
    ).toBe(true);
    expect(
      contestStructureChanges(current, current, true).problemSet,
    ).toBe(true);
  });
});
