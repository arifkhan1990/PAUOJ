import { describe, expect, it } from "vitest";
import { LEARNING_MODULES } from "./modules";

function refs(module: (typeof LEARNING_MODULES)[number]): string[] {
  const topicRefs = module.topics.flatMap((topic) => [
    ...topic.guidedProblemSlugs,
    ...topic.practiceProblemSlugs.easy,
    ...topic.practiceProblemSlugs.medium,
    ...topic.practiceProblemSlugs.hard,
    ...topic.extraProblemSlugs,
  ]);
  return [...topicRefs, ...(module.checkpoint?.problemSlugs ?? [])];
}

const CORE_MODULES = LEARNING_MODULES.filter((module) => module.track !== "sql");
const SQL_MODULES = LEARNING_MODULES.filter((module) => module.track === "sql");

describe("learning curriculum shape", () => {
  it("ships seven ordered live core tracks with unique module slugs", () => {
    expect(CORE_MODULES).toHaveLength(7);
    expect(CORE_MODULES.map((module) => module.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(new Set(LEARNING_MODULES.map((module) => module.slug)).size).toBe(
      LEARNING_MODULES.length,
    );
    expect(LEARNING_MODULES.every((module) => module.status === "LIVE")).toBe(
      true,
    );
  });

  it("ships basic and advanced SQL tracks with project problems", () => {
    expect(SQL_MODULES).toHaveLength(2);
    expect(SQL_MODULES.map((module) => module.order)).toEqual([8, 9]);
    expect(SQL_MODULES.map((module) => module.slug)).toEqual([
      "basic-sql",
      "advanced-sql",
    ]);
    expect(SQL_MODULES.map((track) => track.topics.length)).toEqual([10, 11]);
    for (const track of SQL_MODULES) {
      expect(track.practiceTier).toBe("COMPACT");
      expect(track.checkpoint?.problemSlugs).toHaveLength(3);
      for (const topic of track.topics) {
        expect(topic.guidedProblemSlugs).toHaveLength(2);
        expect(topic.concept.length).toBeGreaterThan(1_000);
      }
    }
  });

  it("gives every core topic the full 3E/3M/2H practice tier", () => {
    for (const track of CORE_MODULES) {
      expect(track.practiceTier).toBe("FULL");
      expect(track.topics.length).toBeGreaterThan(0);
      expect(track.checkpoint?.problemSlugs).toHaveLength(3);
      expect(track.checkpoint?.durationMinutes).toBe(45);

      for (const topic of track.topics) {
        expect(topic.guidedProblemSlugs).toHaveLength(2);
        expect(topic.practiceProblemSlugs.easy).toHaveLength(3);
        expect(topic.practiceProblemSlugs.medium).toHaveLength(3);
        expect(topic.practiceProblemSlugs.hard).toHaveLength(2);
        expect(topic.extraProblemSlugs.length).toBeGreaterThanOrEqual(2);
        expect(topic.extraProblemSlugs.length).toBeLessThanOrEqual(3);
        expect(topic.concept.length).toBeGreaterThan(1_000);
      }

      const unique = new Set(refs(track));
      const expected =
        track.topics.reduce(
          (sum, topic) =>
            sum +
            2 +
            3 +
            3 +
            2 +
            topic.extraProblemSlugs.length,
          0,
        ) + 3;
      expect(unique.size).toBe(expected);
    }
  });
});
