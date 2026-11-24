import { describe, expect, it } from "vitest";
import { formatShortDate } from "./utils";

describe("formatShortDate", () => {
  it("keeps the month so a range crossing a month boundary is unambiguous", () => {
    expect(formatShortDate("2026-11-01")).toBe("01 Nov");
    expect(formatShortDate("2026-12-01")).toBe("01 Dec");
    expect(formatShortDate("2026-11-01")).not.toBe(
      formatShortDate("2026-12-01"),
    );
  });

  it("formats UTC dates consistently", () => {
    expect(formatShortDate("2026-11-24T23:30:00.000Z")).toBe("24 Nov");
  });
});
