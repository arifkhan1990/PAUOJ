import { beforeEach, describe, expect, it, vi } from "vitest";

type FakeRow = Record<string, unknown>;

const dbState = vi.hoisted(() => ({
  contests: [] as FakeRow[],
  changes: [] as FakeRow[],
  participants: [] as FakeRow[],
  notified: [] as FakeRow[],
  notifyThrows: false,
  warn: vi.fn(),
}));

vi.mock("@/server/db", async () => {
  const schema = await import("@/server/db/schema");
  const rowsFor = (table: unknown): FakeRow[] => {
    if (table === schema.contests) return dbState.contests;
    if (table === schema.contestRatingChanges) return dbState.changes;
    if (table === schema.contestRegistrations) return dbState.participants;
    return [];
  };
  const select = () => {
    let rows: FakeRow[] = [];
    const query = {
      from: (table: unknown) => {
        rows = rowsFor(table);
        return query;
      },
      innerJoin: () => query,
      where: () =>
        Object.assign(Promise.resolve(rows), {
          limit: async (count: number) => rows.slice(0, count),
        }),
    };
    return query;
  };
  return { getDb: () => ({ select }) };
});

vi.mock("@/server/logger", () => ({
  logger: { warn: dbState.warn },
}));

vi.mock("./notifications", () => ({
  notifyUser: async (input: FakeRow) => {
    if (dbState.notifyThrows) throw new Error("outbox unavailable");
    dbState.notified.push(input);
    return true;
  },
}));

import {
  contestFallbackResultMessage,
  contestRegistrationDedupeKey,
  contestRegistrationMessage,
  contestReminderDedupeKey,
  contestReminderMessage,
  contestReminderWindow,
  contestResultDedupeKey,
  contestResultMessage,
  formatRatingDelta,
  notifyContestResults,
} from "./contest-notifications";

const contest = {
  id: "11111111-1111-1111-1111-111111111111",
  slug: "monthly-round-12",
  title: "Monthly Round 12",
  startAt: new Date("2026-11-30T16:00:00.000Z"),
};

describe("contestReminderWindow", () => {
  const now = new Date("2026-11-30T15:00:00.000Z");

  it("starts 25 minutes and ends 35 minutes from now", () => {
    const { from, to } = contestReminderWindow(now);
    expect(from.getTime() - now.getTime()).toBe(25 * 60_000);
    expect(to.getTime() - now.getTime()).toBe(35 * 60_000);
  });

  it("is a 10 minute window", () => {
    const { from, to } = contestReminderWindow(now);
    expect(to.getTime() - from.getTime()).toBe(10 * 60_000);
  });
});

describe("contest dedupe keys", () => {
  it("namespaces each contest event by contest id", () => {
    expect(contestRegistrationDedupeKey(contest.id)).toBe(
      `contest-registration:${contest.id}`,
    );
    expect(contestReminderDedupeKey(contest.id)).toBe(
      `contest-reminder-30:${contest.id}`,
    );
    expect(contestResultDedupeKey(contest.id)).toBe(
      `contest-result:${contest.id}`,
    );
  });
});

describe("formatRatingDelta", () => {
  it("marks gains, drops and flat results", () => {
    expect(formatRatingDelta(12)).toBe("+12");
    expect(formatRatingDelta(-8)).toBe("-8");
    expect(formatRatingDelta(0)).toBe("0");
  });
});

describe("contest messages", () => {
  it("announces a registration with the Dhaka start time", () => {
    const message = contestRegistrationMessage(contest);
    expect(message.title).toBe("Registered for Monthly Round 12");
    expect(message.body).toContain("30 Nov 2026, 22:00");
    expect(message.body).toContain("Asia/Dhaka");
  });

  it("announces the 30-minute reminder", () => {
    const message = contestReminderMessage(contest);
    expect(message.title).toBe("Starts in 30 minutes: Monthly Round 12");
    expect(message.body).toContain("30 Nov 2026, 22:00");
  });

  it("reports final rank and rating movement", () => {
    const message = contestResultMessage({
      contestTitle: contest.title,
      rank: 7,
      oldRating: 1500,
      newRating: 1512,
      delta: 12,
    });
    expect(message.title).toBe("Final results: Monthly Round 12");
    expect(message.body).toContain("rank #7");
    expect(message.body).toContain("1500 → 1512");
    expect(message.body).toContain("(+12)");
  });

  it("keeps a negative delta readable", () => {
    const message = contestResultMessage({
      contestTitle: contest.title,
      rank: 42,
      oldRating: 1600,
      newRating: 1592,
      delta: -8,
    });
    expect(message.body).toContain("(-8)");
  });

  it("points rated-out participants at the final standings", () => {
    const message = contestFallbackResultMessage(contest.title);
    expect(message.title).toBe("Final standings: Monthly Round 12");
    expect(message.body).toBe(
      "The contest is complete. Open the final standings to see the results.",
    );
  });
});

describe("notifyContestResults", () => {
  beforeEach(() => {
    dbState.contests = [];
    dbState.changes = [];
    dbState.participants = [];
    dbState.notified = [];
    dbState.notifyThrows = false;
    dbState.warn.mockReset();
  });

  function stage(options: {
    changes?: FakeRow[];
    participants?: FakeRow[];
  }): void {
    dbState.contests = [{ slug: contest.slug, title: contest.title }];
    dbState.changes = options.changes ?? [];
    dbState.participants = options.participants ?? [];
  }

  it("uses the detailed message for rated participants and a fallback for the rest", async () => {
    stage({
      changes: [
        {
          userId: "u-rated",
          rank: 3,
          oldRating: 1500,
          newRating: 1512,
          delta: 12,
        },
      ],
      participants: [
        { userId: "u-rated" },
        { userId: "u-unrated" },
        { userId: "u-unrated" },
      ],
    });

    const sent = await notifyContestResults(contest.id);

    expect(sent).toBe(2);
    expect(dbState.notified).toHaveLength(2);
    const rated = dbState.notified.find((row) => row.userId === "u-rated");
    expect(rated).toMatchObject({
      type: "CONTEST_RESULT",
      title: "Final results: Monthly Round 12",
      href: `/contests/${contest.slug}`,
      dedupeKey: `contest-result:${contest.id}`,
    });
    const unrated = dbState.notified.filter((row) => row.userId === "u-unrated");
    expect(unrated).toHaveLength(1);
    expect(unrated[0]).toMatchObject({
      type: "CONTEST_RESULT",
      title: "Final standings: Monthly Round 12",
      body: "The contest is complete. Open the final standings to see the results.",
      href: `/contests/${contest.slug}`,
      dedupeKey: contestResultDedupeKey(contest.id),
    });
  });

  it("returns 0 when the contest does not exist", async () => {
    expect(await notifyContestResults(contest.id)).toBe(0);
    expect(dbState.notified).toHaveLength(0);
  });

  it("swallows delivery failures so finalization is never broken", async () => {
    stage({ participants: [{ userId: "u-unrated" }] });
    dbState.notifyThrows = true;

    await expect(notifyContestResults(contest.id)).resolves.toBe(0);
    expect(dbState.warn).toHaveBeenCalledWith(
      "Contest result notification failed",
      expect.objectContaining({ contestId: contest.id }),
    );
  });
});
