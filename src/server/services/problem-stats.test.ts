import { describe, expect, it } from "vitest";
import { buildProblemStatistics } from "./problem-stats";

describe("buildProblemStatistics", () => {
  it("totals verdicts, computes success rate and keeps chart order", () => {
    const stats = buildProblemStatistics(
      [
        { status: "WRONG_ANSWER", value: 6 },
        { status: "ACCEPTED", value: 4 },
        { status: "TIME_LIMIT_EXCEEDED", value: "2" },
        { status: "SYSTEM_ERROR", value: 0 },
      ],
      [
        { language: "python", value: 3 },
        { language: "cpp", value: "9" },
        { language: "java", value: 0 },
      ],
    );

    expect(stats.submissionCount).toBe(12);
    expect(stats.acceptedCount).toBe(4);
    expect(stats.successRate).toBeCloseTo(33.33, 1);
    expect(stats.byVerdict).toEqual([
      { status: "ACCEPTED", count: 4 },
      { status: "WRONG_ANSWER", count: 6 },
      { status: "TIME_LIMIT_EXCEEDED", count: 2 },
    ]);
    expect(stats.byLanguage).toEqual([
      { language: "cpp", count: 9 },
      { language: "python", count: 3 },
    ]);
  });

  it("returns zeroed statistics when there are no submissions", () => {
    const stats = buildProblemStatistics([], []);

    expect(stats).toEqual({
      submissionCount: 0,
      acceptedCount: 0,
      successRate: 0,
      byVerdict: [],
      byLanguage: [],
    });
  });
});
