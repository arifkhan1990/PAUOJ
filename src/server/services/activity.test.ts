import { describe, expect, it } from "vitest";
import {
  buildHeatmap,
  computeActiveDays,
  computeCurrentStreak,
  computeLongestStreak,
} from "./activity";

const now = new Date("2026-01-10T12:00:00.000Z");

describe("buildHeatmap", () => {
  it("fills every day in the range, including empty days", () => {
    const days = buildHeatmap(
      [
        { date: "2026-01-08", total: 4, accepted: 3 },
        { date: "2026-01-10", total: 1, accepted: 1 },
      ],
      3,
      now,
    );
    expect(days).toEqual([
      { date: "2026-01-08", total: 4, accepted: 3 },
      { date: "2026-01-09", total: 0, accepted: 0 },
      { date: "2026-01-10", total: 1, accepted: 1 },
    ]);
  });

  it("accepts string numbers from SQL aggregates", () => {
    const days = buildHeatmap([{ date: "2026-01-10", total: "2", accepted: "1" }], 1, now);
    expect(days[0]).toEqual({ date: "2026-01-10", total: 2, accepted: 1 });
  });
});

describe("computeActiveDays and computeLongestStreak", () => {
  it("counts active days and the longest run", () => {
    const days = buildHeatmap(
      [
        { date: "2026-01-01", total: 1, accepted: 1 },
        { date: "2026-01-02", total: 2, accepted: 2 },
        { date: "2026-01-04", total: 1, accepted: 0 },
        { date: "2026-01-05", total: 1, accepted: 1 },
        { date: "2026-01-06", total: 1, accepted: 1 },
        { date: "2026-01-07", total: 1, accepted: 1 },
      ],
      7,
      new Date("2026-01-07T12:00:00.000Z"),
    );

    expect(computeActiveDays(days)).toBe(5);
    expect(computeLongestStreak(days)).toBe(3);
  });
});

describe("computeCurrentStreak", () => {
  it("counts consecutive accepted days ending today", () => {
    const days = buildHeatmap(
      [
        { date: "2026-01-08", total: 1, accepted: 1 },
        { date: "2026-01-09", total: 2, accepted: 2 },
        { date: "2026-01-10", total: 1, accepted: 1 },
      ],
      3,
      now,
    );
    expect(computeCurrentStreak(days, now)).toBe(3);
  });

  it("continues a streak from yesterday when today is empty", () => {
    const days = buildHeatmap(
      [
        { date: "2026-01-08", total: 1, accepted: 1 },
        { date: "2026-01-09", total: 1, accepted: 1 },
      ],
      3,
      now,
    );
    expect(computeCurrentStreak(days, now)).toBe(2);
  });

  it("returns zero after a gap", () => {
    const days = buildHeatmap(
      [{ date: "2026-01-07", total: 1, accepted: 1 }],
      4,
      now,
    );
    expect(computeCurrentStreak(days, now)).toBe(0);
  });
});
