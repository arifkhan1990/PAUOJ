import { describe, expect, it } from "vitest";
import { contestDateParts } from "./contest-date-block";

describe("contestDateParts", () => {
  it("rolls a UTC evening start into the next Asia/Dhaka day", () => {
    // 19:00 UTC on 21 Nov is 01:00 on 22 Nov in Dhaka (+06:00).
    expect(contestDateParts("2026-11-21T19:00:00.000Z")).toEqual({
      weekday: "SUN",
      day: "22",
      month: "Nov",
      time: "01:00",
    });
  });

  it("keeps an ordinary daytime start on the same Dhaka day", () => {
    // 10:30 UTC on 22 Nov is 16:30 on 22 Nov in Dhaka.
    expect(contestDateParts("2026-11-22T10:30:00.000Z")).toEqual({
      weekday: "SUN",
      day: "22",
      month: "Nov",
      time: "16:30",
    });
  });

  it("handles midnight in Dhaka without rolling to 24:00", () => {
    expect(contestDateParts(new Date("2026-11-22T18:00:00.000Z"))).toEqual({
      weekday: "MON",
      day: "23",
      month: "Nov",
      time: "00:00",
    });
  });

  it("crosses a month boundary correctly", () => {
    // 19:00 UTC on 30 Nov is 01:00 on 1 Dec in Dhaka.
    expect(contestDateParts("2026-11-30T19:00:00.000Z")).toEqual({
      weekday: "TUE",
      day: "01",
      month: "Dec",
      time: "01:00",
    });
  });
});
