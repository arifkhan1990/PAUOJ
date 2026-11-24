import { describe, expect, it } from "vitest";
import { contestListHref, groupContestsByStatus } from "./contests";
import type { ContestListItem } from "./types";

function contest(id: string, status: ContestListItem["status"]): ContestListItem {
  return {
    id,
    slug: id,
    title: id,
    description: "",
    bannerUrl: null,
    startAt: "2026-11-29T04:00:00.000Z",
    endAt: "2026-11-29T06:00:00.000Z",
    status,
    division: "OPEN",
    format: "SINGLE",
    teamSize: 1,
    isOfficial: false,
    seriesId: null,
    feeStatus: "NOT_REQUIRED",
    sponsor: null,
    freezeMinutes: 0,
    participantCount: 0,
    problemCount: 0,
    registered: false,
  };
}

describe("contestListHref", () => {
  it("returns the bare list for an empty or ALL state", () => {
    expect(contestListHref()).toBe("/contests");
    expect(contestListHref({ filter: "ALL" })).toBe("/contests");
  });

  it("serializes each active filter", () => {
    expect(
      contestListHref({
        filter: "ENDED",
        division: "DIV2",
        format: "GROUP",
      }),
    ).toBe("/contests?filter=ENDED&division=DIV2&format=GROUP");
  });

  it("keeps filters independent when one is cleared", () => {
    expect(contestListHref({ filter: "UPCOMING", format: "SINGLE" })).toBe(
      "/contests?filter=UPCOMING&format=SINGLE",
    );
    expect(contestListHref({ division: "OPEN" })).toBe(
      "/contests?division=OPEN",
    );
  });
});

describe("groupContestsByStatus", () => {
  it("orders live, upcoming and past and keeps input order inside a group", () => {
    const groups = groupContestsByStatus([
      contest("live-1", "RUNNING"),
      contest("past-1", "ENDED"),
      contest("next-1", "UPCOMING"),
      contest("live-2", "RUNNING"),
      contest("next-2", "UPCOMING"),
    ]);

    expect(groups.map((group) => group.label)).toEqual([
      "Live now",
      "Upcoming",
      "Past contests",
    ]);
    expect(groups[0].items.map((item) => item.id)).toEqual([
      "live-1",
      "live-2",
    ]);
    expect(groups[1].items.map((item) => item.id)).toEqual([
      "next-1",
      "next-2",
    ]);
  });

  it("drops empty groups so filtered pages do not render dead headings", () => {
    expect(groupContestsByStatus([contest("past-1", "ENDED")])).toEqual([
      expect.objectContaining({ status: "ENDED", label: "Past contests" }),
    ]);
    expect(groupContestsByStatus([])).toEqual([]);
  });
});
