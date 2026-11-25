import { describe, expect, it } from "vitest";
import { LEARNING_MODULES } from "./modules";
import {
  findModuleForProblemSlug,
  idleDaysSince,
  latestActivity,
  moduleProblemSlugs,
  selectReminderThreshold,
} from "./activity";
import type { LearningModuleDefinition } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

function makeModule(): LearningModuleDefinition {
  return {
    slug: "test-module",
    order: 1,
    title: "Test module",
    subtitle: "",
    goal: "",
    description: "",
    estimatedHours: 1,
    status: "LIVE",
    topics: [
      {
        slug: "topic-1",
        title: "Topic 1",
        titleBn: "",
        summary: "",
        concept: "",
        guidedProblemSlugs: ["guided-a", "shared"],
        practiceProblemSlugs: {
          easy: ["easy-a"],
          medium: ["medium-a"],
          hard: ["hard-a"],
        },
        extraProblemSlugs: ["extra-a", "shared"],
      },
    ],
    checkpoint: {
      title: "Checkpoint",
      titleBn: "",
      description: "",
      durationMinutes: 60,
      problemSlugs: ["checkpoint-a", "guided-a"],
      badge: { slug: "badge", name: "Badge", description: "" },
    },
  };
}

describe("moduleProblemSlugs", () => {
  it("covers every topic tier plus the checkpoint, without duplicates", () => {
    const slugs = moduleProblemSlugs(makeModule());
    expect(new Set(slugs)).toEqual(
      new Set([
        "guided-a",
        "easy-a",
        "medium-a",
        "hard-a",
        "extra-a",
        "shared",
        "checkpoint-a",
      ]),
    );
    expect(slugs).toHaveLength(7);
  });

  it("works for a module without a checkpoint", () => {
    expect(moduleProblemSlugs({ ...makeModule(), checkpoint: null })).toEqual([
      "guided-a",
      "shared",
      "easy-a",
      "medium-a",
      "hard-a",
      "extra-a",
    ]);
  });
});

describe("findModuleForProblemSlug", () => {
  const [first] = LEARNING_MODULES;

  it("finds the live module that owns a topic problem", () => {
    const slug = first.topics[0].guidedProblemSlugs[0];
    expect(findModuleForProblemSlug(slug)?.slug).toBe(first.slug);
  });

  it("finds the live module that owns a checkpoint problem", () => {
    const slug = first.checkpoint?.problemSlugs[0];
    expect(slug).toBeTruthy();
    expect(findModuleForProblemSlug(slug ?? "")?.slug).toBe(first.slug);
  });

  it("returns null for an unknown problem", () => {
    expect(findModuleForProblemSlug("no-such-problem")).toBeNull();
  });
});

describe("idleDaysSince", () => {
  const now = new Date("2026-01-10T12:00:00.000Z");

  it("counts whole days of inactivity", () => {
    expect(idleDaysSince(now, now)).toBe(0);
    expect(idleDaysSince(new Date(now.getTime() - 6 * DAY_MS), now)).toBe(6);
    expect(idleDaysSince(new Date(now.getTime() - 7 * DAY_MS), now)).toBe(7);
    expect(idleDaysSince(new Date(now.getTime() - 21 * DAY_MS), now)).toBe(21);
  });

  it("floors partial days", () => {
    expect(idleDaysSince(new Date(now.getTime() - 6.9 * DAY_MS), now)).toBe(6);
    expect(idleDaysSince(new Date(now.getTime() - 20.99 * DAY_MS), now)).toBe(
      20,
    );
  });

  it("clamps clock skew to zero", () => {
    expect(idleDaysSince(new Date(now.getTime() + DAY_MS), now)).toBe(0);
  });
});

describe("selectReminderThreshold", () => {
  it("stays quiet before a week of inactivity", () => {
    expect(selectReminderThreshold(0)).toBeNull();
    expect(selectReminderThreshold(6)).toBeNull();
  });

  it("uses the 7-day nudge for a week and up to three weeks", () => {
    expect(selectReminderThreshold(7)).toBe(7);
    expect(selectReminderThreshold(20)).toBe(7);
  });

  it("escalates to the 21-day nudge afterwards", () => {
    expect(selectReminderThreshold(21)).toBe(21);
    expect(selectReminderThreshold(90)).toBe(21);
  });

  it("ignores non-numeric input", () => {
    expect(selectReminderThreshold(Number.NaN)).toBeNull();
  });
});

describe("latestActivity", () => {
  const early = new Date("2026-01-01T00:00:00.000Z");
  const late = new Date("2026-01-05T00:00:00.000Z");

  it("picks the newest timestamp and ignores missing ones", () => {
    expect(latestActivity([early, null, late, undefined])).toEqual(late);
    expect(latestActivity([late, early])).toEqual(late);
  });

  it("returns null when nothing is known", () => {
    expect(latestActivity([null, undefined])).toBeNull();
    expect(latestActivity([])).toBeNull();
  });
});
