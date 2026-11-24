import { describe, expect, it } from "vitest";
import { checkContestHostWindow, isValidContestHostingFee } from "./contest-hosting";

describe("contest hosting policy", () => {
  it("accepts the published fee range and rejects everything else", () => {
    expect(isValidContestHostingFee(3000)).toBe(true);
    expect(isValidContestHostingFee(5000)).toBe(true);
    expect(isValidContestHostingFee(4000)).toBe(true);
    expect(isValidContestHostingFee(2999)).toBe(false);
    expect(isValidContestHostingFee(5001)).toBe(false);
    expect(isValidContestHostingFee(3500.5)).toBe(false);
    expect(isValidContestHostingFee(Number.NaN)).toBe(false);
  });

  it("accepts a window between fifteen minutes and a day", () => {
    const start = new Date("2026-12-20T04:00:00.000Z");
    const check = checkContestHostWindow(
      start,
      new Date("2026-12-20T05:30:00.000Z"),
    );
    expect(check).toEqual({ valid: true, durationMinutes: 90 });
  });

  it("rejects inverted and too-short windows", () => {
    const start = new Date("2026-12-20T04:00:00.000Z");
    expect(
      checkContestHostWindow(start, new Date("2026-12-20T03:00:00.000Z")).valid,
    ).toBe(false);
    expect(
      checkContestHostWindow(start, new Date("2026-12-20T04:10:00.000Z")).valid,
    ).toBe(false);
  });

  it("rejects windows longer than a day and invalid dates", () => {
    const start = new Date("2026-12-20T04:00:00.000Z");
    expect(
      checkContestHostWindow(start, new Date("2026-12-21T05:00:00.000Z")).valid,
    ).toBe(false);
    expect(checkContestHostWindow(new Date("nope"), start).valid).toBe(false);
  });
});
