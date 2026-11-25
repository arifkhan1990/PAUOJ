import { describe, expect, it } from "vitest";
import {
  achievementBadgesFor,
  crossedRatingTiers,
  longestAcceptedDayStreak,
  milestoneForSolvedCount,
  SOLVED_MILESTONES,
} from "./achievement-notifications";

describe("milestoneForSolvedCount", () => {
  it("matches exact solved milestones only", () => {
    for (const milestone of SOLVED_MILESTONES) {
      expect(milestoneForSolvedCount(milestone)).toBe(milestone);
    }
  });

  it("never fires between or above milestones", () => {
    for (const count of [0, 2, 9, 99, 101, 249, 1001, 5000]) {
      expect(milestoneForSolvedCount(count)).toBeNull();
    }
  });
});

describe("achievementBadgesFor", () => {
  const base = {
    solvedCount: 0,
    submissionCount: 0,
    acceptedLanguages: 0,
    longestStreak: 0,
  };

  it("fires each badge on the exact threshold only", () => {
    expect(achievementBadgesFor({ ...base, solvedCount: 10 })).toEqual([
      "ten-solved",
    ]);
    expect(achievementBadgesFor({ ...base, solvedCount: 50 })).toEqual([
      "fifty-solved",
    ]);
    expect(achievementBadgesFor({ ...base, submissionCount: 500 })).toEqual([
      "prolific",
    ]);
    expect(achievementBadgesFor({ ...base, acceptedLanguages: 3 })).toEqual([
      "polyglot",
    ]);
    expect(achievementBadgesFor({ ...base, longestStreak: 7 })).toEqual([
      "streak-7",
    ]);
  });

  it("does not mail existing users who already passed a threshold", () => {
    expect(
      achievementBadgesFor({
        ...base,
        solvedCount: 60,
        submissionCount: 501,
        acceptedLanguages: 4,
        longestStreak: 9,
      }),
    ).toEqual([]);
  });

  it("can report several badges from one accepted submission", () => {
    expect(
      achievementBadgesFor({
        solvedCount: 10,
        submissionCount: 500,
        acceptedLanguages: 3,
        longestStreak: 7,
      }),
    ).toEqual(["ten-solved", "prolific", "polyglot", "streak-7"]);
  });
});

describe("longestAcceptedDayStreak", () => {
  it("counts consecutive UTC dates and ignores gaps", () => {
    expect(
      longestAcceptedDayStreak([
        "2026-11-01",
        "2026-11-02",
        "2026-11-03",
        "2026-11-07",
        "2026-11-08",
      ]),
    ).toBe(3);
  });

  it("ignores duplicates and unsorted input", () => {
    expect(
      longestAcceptedDayStreak([
        "2026-11-03",
        "2026-11-01",
        "2026-11-02",
        "2026-11-02",
      ]),
    ).toBe(3);
  });

  it("handles month and year boundaries", () => {
    expect(
      longestAcceptedDayStreak(["2026-12-31", "2027-01-01", "2027-01-02"]),
    ).toBe(3);
  });

  it("returns zero without accepted days", () => {
    expect(longestAcceptedDayStreak([])).toBe(0);
  });
});

describe("crossedRatingTiers", () => {
  it("fires when a rating lands exactly on a tier", () => {
    expect(crossedRatingTiers(1580, 1600).map((tier) => tier.id)).toEqual([
      "rated-1600",
    ]);
    expect(crossedRatingTiers(1799, 1800).map((tier) => tier.id)).toEqual([
      "rated-1800",
    ]);
    expect(crossedRatingTiers(1950, 2000).map((tier) => tier.id)).toEqual([
      "rated-2000",
    ]);
  });

  it("reports every tier crossed by one big jump", () => {
    expect(crossedRatingTiers(1500, 2010).map((tier) => tier.id)).toEqual([
      "rated-1600",
      "rated-1800",
      "rated-2000",
    ]);
  });

  it("does not re-fire when the rating stays inside a tier", () => {
    expect(crossedRatingTiers(1610, 1700)).toEqual([]);
    expect(crossedRatingTiers(2050, 2100)).toEqual([]);
  });

  it("does not fire on a drop", () => {
    expect(crossedRatingTiers(1650, 1590)).toEqual([]);
  });
});
