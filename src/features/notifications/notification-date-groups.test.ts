import { describe, expect, it } from "vitest";
import { formatUnreadBadge, groupByLocalDay } from "./notification-date-groups";

/** Fixed local clock: Thursday 26 Nov 2026, 09:30 local time. */
const NOW = new Date(2026, 10, 26, 9, 30, 0);

function at(day: number, hour = 12, minute = 0): { createdAt: string } {
  return { createdAt: new Date(2026, 10, day, hour, minute, 0).toISOString() };
}

describe("groupByLocalDay", () => {
  it("returns Today, Yesterday and Earlier sections in order", () => {
    const items = [
      at(26, 8),
      at(26, 7),
      at(25, 23),
      at(24, 18),
      at(1, 0),
    ];

    const sections = groupByLocalDay(items, NOW);

    expect(sections.map((section) => section.key)).toEqual([
      "today",
      "yesterday",
      "earlier",
    ]);
    expect(sections.map((section) => section.label)).toEqual([
      "Today",
      "Yesterday",
      "Earlier",
    ]);
    expect(sections[0]?.items).toHaveLength(2);
    expect(sections[1]?.items).toHaveLength(1);
    expect(sections[2]?.items).toHaveLength(2);
  });

  it("preserves the newest-first input order inside each section", () => {
    const newest = at(26, 8);
    const oldest = at(26, 1);
    const sections = groupByLocalDay([newest, oldest], NOW);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.items).toEqual([newest, oldest]);
  });

  it("omits empty sections", () => {
    const sections = groupByLocalDay([at(1, 9)], NOW);

    expect(sections.map((section) => section.key)).toEqual(["earlier"]);
  });

  it("returns an empty list for no items", () => {
    expect(groupByLocalDay([], NOW)).toEqual([]);
  });

  it("treats malformed timestamps as Earlier instead of throwing", () => {
    const sections = groupByLocalDay([{ createdAt: "not-a-date" }], NOW);

    expect(sections).toHaveLength(1);
    expect(sections[0]?.key).toBe("earlier");
  });
});

describe("formatUnreadBadge", () => {
  it("hides the badge at zero and below", () => {
    expect(formatUnreadBadge(0)).toBeNull();
    expect(formatUnreadBadge(-3)).toBeNull();
  });

  it("prints the exact count up to 99", () => {
    expect(formatUnreadBadge(1)).toBe("1");
    expect(formatUnreadBadge(99)).toBe("99");
  });

  it("caps the badge at 99+", () => {
    expect(formatUnreadBadge(100)).toBe("99+");
    expect(formatUnreadBadge(120)).toBe("99+");
  });
});
