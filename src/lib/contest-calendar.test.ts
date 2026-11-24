import { describe, expect, it } from "vitest";
import {
  buildContestCalendar,
  contestCalendarFilename,
  icsDateTime,
  icsEscape,
  icsFoldLine,
} from "./contest-calendar";

describe("icsEscape", () => {
  it("escapes backslashes, separators and newlines", () => {
    expect(icsEscape("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });

  it("leaves plain text untouched", () => {
    expect(icsEscape("Monthly Round 12")).toBe("Monthly Round 12");
  });
});

describe("icsDateTime", () => {
  it("formats UTC compact timestamps", () => {
    expect(icsDateTime("2026-11-30T16:00:00.000Z")).toBe("20261130T160000Z");
  });

  it("converts a Dhaka wall-clock instant to UTC", () => {
    expect(icsDateTime(new Date("2026-12-20T04:00:00.000Z"))).toBe(
      "20261220T040000Z",
    );
  });

  it("rejects invalid dates", () => {
    expect(() => icsDateTime("not-a-date")).toThrow("Invalid contest date");
  });
});

describe("icsFoldLine", () => {
  it("leaves short lines alone", () => {
    expect(icsFoldLine("SUMMARY:Short")).toBe("SUMMARY:Short");
  });

  it("folds long lines at 75 octets with a leading space", () => {
    const folded = icsFoldLine(`DESCRIPTION:${"a".repeat(120)}`);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts[0]?.startsWith("DESCRIPTION:")).toBe(true);
    for (const part of parts.slice(1)) {
      expect(part.startsWith(" ")).toBe(true);
    }
    expect(parts.every((part) => part.length <= 75)).toBe(true);
    expect(parts.join("").replace(/\s/g, "")).toBe(`DESCRIPTION:${"a".repeat(120)}`);
  });

  it("never splits a multi-byte character", () => {
    const folded = icsFoldLine(`SUMMARY:${"ক".repeat(60)}`);
    for (const part of folded.split("\r\n")) {
      expect(part).not.toContain("\uFFFD");
    }
  });
});

describe("buildContestCalendar", () => {
  const stamp = "2026-11-24T09:30:00.000Z";

  it("emits a valid UTC VEVENT", () => {
    const ics = buildContestCalendar({
      title: "Monthly Round 12",
      description: "Rated, 90 minutes.",
      startAt: "2026-11-30T16:00:00.000Z",
      endAt: "2026-11-30T17:30:00.000Z",
      url: "https://oj.primeasia.edu.bd/contests/monthly-12",
      uidSeed: "monthly-12",
      stamp,
    });

    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTAMP:20261124T093000Z");
    expect(ics).toContain("DTSTART:20261130T160000Z");
    expect(ics).toContain("DTEND:20261130T173000Z");
    expect(ics).toContain("SUMMARY:Monthly Round 12");
    expect(ics).toContain("DESCRIPTION:Rated\\, 90 minutes.");
    expect(ics).toContain(
      "URL:https://oj.primeasia.edu.bd/contests/monthly-12",
    );
    expect(ics).toContain("LOCATION:PAU OJ");
    expect(ics).toContain("UID:monthly-12@pauoj");
    // Every content line uses CRLF, never a bare newline.
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("omits DESCRIPTION when there is no text", () => {
    const ics = buildContestCalendar({
      title: "Round",
      description: "   ",
      startAt: "2026-11-30T16:00:00.000Z",
      endAt: "2026-11-30T17:30:00.000Z",
      url: "https://example.test/contests/round",
      uidSeed: "round",
      stamp,
    });
    expect(ics).not.toContain("DESCRIPTION:");
  });

  it("rejects non-positive durations", () => {
    expect(() =>
      buildContestCalendar({
        title: "Round",
        startAt: "2026-11-30T16:00:00.000Z",
        endAt: "2026-11-30T16:00:00.000Z",
        url: "https://example.test/contests/round",
        uidSeed: "round",
        stamp,
      }),
    ).toThrow("Contest end must be after the start");
  });
});

describe("contestCalendarFilename", () => {
  it("slugifies the contest slug", () => {
    expect(contestCalendarFilename("monthly-round-12")).toBe(
      "pauoj-monthly-round-12.ics",
    );
    expect(contestCalendarFilename("round 12 / final")).toBe(
      "pauoj-round-12-final.ics",
    );
    expect(contestCalendarFilename("")).toBe("pauoj-contest.ics");
  });
});
