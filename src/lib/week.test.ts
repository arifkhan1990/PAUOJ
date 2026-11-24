import { describe, expect, it } from "vitest";
import {
  addUtcDays,
  formatWeekLabel,
  parseWeekAnchor,
  startOfUtcWeek,
  utcDayKey,
} from "./week";

const utc = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe("startOfUtcWeek", () => {
  it("snaps a mid-week UTC date to Sunday midnight", () => {
    const start = startOfUtcWeek(new Date("2026-11-24T10:35:00.000Z"));
    expect(start.toISOString()).toBe("2026-11-22T00:00:00.000Z");
  });

  it("keeps a Sunday at midnight unchanged", () => {
    expect(startOfUtcWeek(utc("2026-11-22")).toISOString()).toBe(
      "2026-11-22T00:00:00.000Z",
    );
  });

  it("snaps Saturday back to the same Sunday", () => {
    expect(startOfUtcWeek(utc("2026-11-28")).toISOString()).toBe(
      "2026-11-22T00:00:00.000Z",
    );
  });

  it("crosses the year boundary correctly", () => {
    expect(startOfUtcWeek(utc("2027-01-01")).toISOString()).toBe(
      "2026-12-27T00:00:00.000Z",
    );
  });
});

describe("addUtcDays", () => {
  it("moves forward and backward across month boundaries", () => {
    expect(utcDayKey(addUtcDays(utc("2026-11-30"), 1))).toBe("2026-12-01");
    expect(utcDayKey(addUtcDays(utc("2026-12-01"), -1))).toBe("2026-11-30");
    expect(utcDayKey(addUtcDays(utc("2026-11-22"), 7))).toBe("2026-11-29");
  });

  it("does not mutate the input date", () => {
    const input = utc("2026-11-22");
    addUtcDays(input, 7);
    expect(input.toISOString()).toBe("2026-11-22T00:00:00.000Z");
  });
});

describe("formatWeekLabel", () => {
  it("formats a same-month week in short and long styles", () => {
    const start = utc("2026-11-22");
    const end = utc("2026-11-28");
    expect(formatWeekLabel(start, end, "short")).toBe("22–28 Nov 2026");
    expect(formatWeekLabel(start, end)).toBe("22–28 November 2026");
  });

  it("formats a cross-month week without repeating the year", () => {
    expect(
      formatWeekLabel(utc("2026-11-29"), utc("2026-12-05"), "short"),
    ).toBe("29 Nov – 5 Dec 2026");
  });

  it("formats a cross-year week with both years", () => {
    expect(
      formatWeekLabel(utc("2026-12-27"), utc("2027-01-02"), "short"),
    ).toBe("27 Dec 2026 – 2 Jan 2027");
  });
});

describe("parseWeekAnchor", () => {
  const current = utc("2026-11-22");
  const earliest = utc("2026-11-15");

  it("accepts a valid Sunday within range", () => {
    expect(parseWeekAnchor("2026-11-15", current, earliest).toISOString()).toBe(
      "2026-11-15T00:00:00.000Z",
    );
  });

  it("accepts the current week", () => {
    expect(parseWeekAnchor("2026-11-22", current, earliest).toISOString()).toBe(
      "2026-11-22T00:00:00.000Z",
    );
  });

  it("falls back to current for invalid or non-Sunday values", () => {
    expect(parseWeekAnchor("not-a-date", current, earliest)).toBe(current);
    expect(parseWeekAnchor("2026-11-24", current, earliest)).toBe(current);
    expect(parseWeekAnchor(undefined, current, earliest)).toBe(current);
  });

  it("clamps before the earliest week and after the current week", () => {
    expect(parseWeekAnchor("2026-11-08", current, earliest)).toBe(earliest);
    expect(parseWeekAnchor("2026-11-29", current, earliest)).toBe(current);
  });

  it("uses the first value when the query repeats", () => {
    expect(
      parseWeekAnchor(["2026-11-15", "2026-11-22"], current, earliest).toISOString(),
    ).toBe("2026-11-15T00:00:00.000Z");
  });
});
