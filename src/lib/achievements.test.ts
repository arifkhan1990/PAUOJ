import { describe, expect, it } from "vitest";
import { buildAchievements } from "./achievements";

const base = {
  solvedCount: 0,
  submissionCount: 0,
  contestCount: 0,
  rating: 1500,
  longestStreak: 0,
  acceptedLanguages: 0,
};

describe("buildAchievements", () => {
  it("marks milestones from real stats", () => {
    const achievements = buildAchievements({
      ...base,
      solvedCount: 50,
      submissionCount: 500,
      contestCount: 2,
      rating: 1800,
      longestStreak: 8,
      acceptedLanguages: 3,
    });
    const earned = achievements
      .filter((achievement) => achievement.earned)
      .map((achievement) => achievement.id);

    expect(earned).toContain("first-accepted");
    expect(earned).toContain("ten-solved");
    expect(earned).toContain("fifty-solved");
    expect(earned).not.toContain("century");
    expect(earned).toContain("prolific");
    expect(earned).toContain("contest-debut");
    expect(earned).toContain("rated-1800");
    expect(earned).not.toContain("rated-2000");
    expect(earned).toContain("streak-7");
    expect(earned).toContain("polyglot");
  });

  it("keeps unearned badges with progress", () => {
    const achievements = buildAchievements({ ...base, solvedCount: 5 });
    const ten = achievements.find(
      (achievement) => achievement.id === "ten-solved",
    );
    expect(ten).toMatchObject({ earned: false, value: 5, target: 10 });
  });

  it("puts earned badges first", () => {
    const achievements = buildAchievements({ ...base, solvedCount: 1 });
    expect(achievements[0]?.id).toBe("first-accepted");
    expect(achievements[0]?.earned).toBe(true);
  });

  it("does not award rating badges before a rated contest", () => {
    const achievements = buildAchievements({ ...base, rating: 2000 });
    const rated = achievements.filter((achievement) =>
      achievement.id.startsWith("rated-"),
    );
    expect(rated.every((achievement) => !achievement.earned)).toBe(true);
  });
});
