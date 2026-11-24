import { describe, expect, it } from "vitest";
import type { DailyChallengeProblem } from "./daily-challenge";
import { buildDailyChallengeWeek } from "./daily-challenge-week";

const utc = (value: string) => new Date(`${value}T00:00:00.000Z`);

const problem = (
  id: string,
  title: string,
  overrides: Partial<DailyChallengeProblem> = {},
): DailyChallengeProblem => ({
  id,
  slug: title.toLowerCase().replaceAll(" ", "-"),
  title,
  difficulty: "MEDIUM",
  points: 200,
  ...overrides,
});

const NOW = new Date("2026-11-24T10:00:00.000Z");
const JOINED = new Date("2026-11-17T06:00:00.000Z");

describe("buildDailyChallengeWeek", () => {
  const problemsByDate = new Map<string, DailyChallengeProblem>([
    ["2026-11-22", problem("p22", "Balanced Brackets")],
    ["2026-11-23", problem("p23", "Array Rotation", { difficulty: "EASY", points: 100 })],
    ["2026-11-24", problem("p24", "A + B", { difficulty: "EASY", points: 100 })],
  ]);

  it("builds the seven UTC days and marks future/today flags", () => {
    const week = buildDailyChallengeWeek({
      anchor: utc("2026-11-22"),
      now: NOW,
      joinedAt: JOINED,
      problemsByDate,
      completedKeys: new Set(),
    });

    expect(week.anchor).toBe("2026-11-22");
    expect(week.days.map((day) => day.date)).toEqual([
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
    ]);
    expect(week.days.map((day) => day.isFuture)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ]);
    expect(week.days.filter((day) => day.isToday).map((day) => day.date)).toEqual([
      "2026-11-24",
    ]);
    expect(week.days.every((day) => !day.isBeforeJoin)).toBe(true);
  });

  it("marks same-day accepted challenge problems as completed", () => {
    const week = buildDailyChallengeWeek({
      anchor: utc("2026-11-22"),
      now: NOW,
      joinedAt: JOINED,
      problemsByDate,
      completedKeys: new Set(["2026-11-22:p22", "2026-11-24:p24"]),
    });

    expect(week.days.map((day) => day.completed)).toEqual([
      true,
      false,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(week.completedCount).toBe(2);
  });

  it("does not reveal future challenge problems even if supplied", () => {
    const withFuture = new Map(problemsByDate);
    withFuture.set("2026-11-25", problem("p25", "Future Problem"));

    const week = buildDailyChallengeWeek({
      anchor: utc("2026-11-22"),
      now: NOW,
      joinedAt: JOINED,
      problemsByDate: withFuture,
      completedKeys: new Set(["2026-11-25:p25"]),
    });

    const future = week.days.find((day) => day.date === "2026-11-25");
    expect(future?.problem).toBeNull();
    expect(future?.completed).toBe(false);
    expect(week.completedCount).toBe(0);
  });

  it("hides challenge data before the user's join date", () => {
    const week = buildDailyChallengeWeek({
      anchor: utc("2026-11-22"),
      now: NOW,
      joinedAt: utc("2026-11-24"),
      problemsByDate,
      completedKeys: new Set(["2026-11-22:p22"]),
    });

    expect(week.days[0]).toMatchObject({
      date: "2026-11-22",
      isBeforeJoin: true,
      problem: null,
      completed: false,
    });
    expect(week.days[1]).toMatchObject({
      date: "2026-11-23",
      isBeforeJoin: true,
      problem: null,
    });
    expect(week.days[2]).toMatchObject({
      date: "2026-11-24",
      isBeforeJoin: false,
      completed: false,
    });
    expect(week.completedCount).toBe(0);
  });

  it("keeps a challenge unresolved when another problem was solved that day", () => {
    const week = buildDailyChallengeWeek({
      anchor: utc("2026-11-22"),
      now: NOW,
      joinedAt: JOINED,
      problemsByDate,
      completedKeys: new Set([
        "2026-11-22:p-other",
        "2026-11-21:p22",
      ]),
    });

    expect(week.days[0]?.completed).toBe(false);
    expect(week.completedCount).toBe(0);
  });

  it("returns neutral cells when no challenge is available", () => {
    const week = buildDailyChallengeWeek({
      anchor: utc("2026-11-22"),
      now: NOW,
      joinedAt: JOINED,
      problemsByDate: new Map(),
      completedKeys: new Set(),
    });

    expect(week.days.every((day) => day.problem === null)).toBe(true);
    expect(week.days.every((day) => day.completed === false)).toBe(true);
    expect(week.completedCount).toBe(0);
  });

  it("strips the database id from exposed problems", () => {
    const week = buildDailyChallengeWeek({
      anchor: utc("2026-11-22"),
      now: NOW,
      joinedAt: JOINED,
      problemsByDate,
      completedKeys: new Set(),
    });

    expect(week.days[0]?.problem).toEqual({
      slug: "balanced-brackets",
      title: "Balanced Brackets",
      difficulty: "MEDIUM",
      points: 200,
    });
    expect(week.days[0]?.problem).not.toHaveProperty("id");
  });

  it("formats the short and full week labels", () => {
    const week = buildDailyChallengeWeek({
      anchor: utc("2026-11-22"),
      now: NOW,
      joinedAt: JOINED,
      problemsByDate,
      completedKeys: new Set(),
    });

    expect(week.label).toBe("22–28 Nov 2026");
    expect(week.fullLabel).toBe("22–28 November 2026");
  });

  it("snaps a mid-week anchor and labels a cross-month week", () => {
    const week = buildDailyChallengeWeek({
      anchor: utc("2026-12-01"),
      now: NOW,
      joinedAt: JOINED,
      problemsByDate: new Map(),
      completedKeys: new Set(),
    });

    expect(week.anchor).toBe("2026-11-29");
    expect(week.days[0]?.date).toBe("2026-11-29");
    expect(week.days[6]?.date).toBe("2026-12-05");
    expect(week.label).toBe("29 Nov – 5 Dec 2026");
  });
});
