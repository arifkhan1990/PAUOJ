import { describe, expect, it } from "vitest";
import {
  MONTHLY_SERIES_SCHEDULE,
  monthlySeriesEnd,
  monthlySeriesSlug,
  monthlySeriesTitle,
  nextMonthlySeriesStart,
} from "./contest-schedule";

describe("monthly contest schedule", () => {
  it("finds the third Sunday at 10:00 Asia/Dhaka (04:00 UTC)", () => {
    const now = new Date("2026-11-24T00:00:00.000Z");
    const start = nextMonthlySeriesStart(now);
    expect(start.toISOString()).toBe("2026-12-20T04:00:00.000Z");
  });

  it("advances to the next month after the occurrence has started", () => {
    const now = new Date("2026-12-20T04:00:00.000Z");
    const start = nextMonthlySeriesStart(now);
    expect(start.toISOString()).toBe("2027-01-17T04:00:00.000Z");
  });

  it("uses the third Sunday, not the third week", () => {
    const now = new Date("2027-01-01T00:00:00.000Z");
    const start = nextMonthlySeriesStart(now);
    expect(start.toISOString()).toBe("2027-01-17T04:00:00.000Z");
  });

  it("runs for ninety minutes", () => {
    const start = new Date("2026-12-20T04:00:00.000Z");
    expect(monthlySeriesEnd(start).toISOString()).toBe(
      "2026-12-20T05:30:00.000Z",
    );
    expect(MONTHLY_SERIES_SCHEDULE.durationMinutes).toBe(90);
  });

  it("creates a human title and stable slug in Dhaka time", () => {
    const start = new Date("2026-12-20T04:00:00.000Z");
    expect(monthlySeriesTitle(start)).toBe(
      "PAU Monthly Contest — December 2026",
    );
    expect(monthlySeriesSlug(start)).toBe("pau-monthly-2026-12");
  });

  it("does not pick a date in the past when now is mid-month", () => {
    const start = nextMonthlySeriesStart(new Date("2026-12-21T04:00:00.000Z"));
    expect(start.getTime()).toBeGreaterThan(
      new Date("2026-12-21T04:00:00.000Z").getTime(),
    );
  });
});
