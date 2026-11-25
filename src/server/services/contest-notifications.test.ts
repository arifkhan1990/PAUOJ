import { describe, expect, it } from "vitest";
import {
  contestRegistrationDedupeKey,
  contestRegistrationMessage,
  contestReminderDedupeKey,
  contestReminderMessage,
  contestReminderWindow,
  contestResultDedupeKey,
  contestResultMessage,
  formatRatingDelta,
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
});
