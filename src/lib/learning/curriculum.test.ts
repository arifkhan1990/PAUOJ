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

describe("learning curriculum shape", () => {
  it("ships seven ordered live tracks with unique module slugs", () => {
    expect(LEARNING_MODULES).toHaveLength(7);
    expect(LEARNING_MODULES.map((module) => module.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(new Set(LEARNING_MODULES.map((module) => module.slug)).size).toBe(7);
    expect(LEARNING_MODULES.every((module) => module.status === "LIVE")).toBe(
      true,
    );
  });

  it("ships Module 1 with the full 3/3/2 practice tier", () => {
    const track = LEARNING_MODULES.find(
      (item) => item.slug === "basic-programming-math",
    );
    expect(track?.practiceTier).toBe("FULL");
    expect(track?.topics).toHaveLength(5);

    for (const topic of track?.topics ?? []) {
      expect(topic.guidedProblemSlugs).toHaveLength(2);
      expect(topic.practiceProblemSlugs.easy).toHaveLength(3);
      expect(topic.practiceProblemSlugs.medium).toHaveLength(3);
      expect(topic.practiceProblemSlugs.hard).toHaveLength(2);
      expect(topic.extraProblemSlugs.length).toBeGreaterThanOrEqual(2);
      expect(topic.extraProblemSlugs.length).toBeLessThanOrEqual(3);
      expect(topic.concept.length).toBeGreaterThan(1_000);
    }

    expect(track?.checkpoint?.problemSlugs).toHaveLength(3);
    expect(track?.checkpoint?.durationMinutes).toBe(45);
    expect(track?.checkpoint?.badge.slug).toBe("foundation-coder");
    expect(new Set(refs(track!)).size).toBe(refs(track!).length);
  });

  it("keeps every later track at seven problems per topic plus a checkpoint", () => {
    for (const track of LEARNING_MODULES.filter(
      (item) => item.slug !== "basic-programming-math",
    )) {
      expect(track.checkpoint?.problemSlugs).toHaveLength(3);
      expect(track.checkpoint?.durationMinutes).toBe(45);
      for (const topic of track.topics) {
        expect(topic.guidedProblemSlugs).toHaveLength(2);
        expect(topic.practiceProblemSlugs.easy).toHaveLength(1);
        expect(topic.practiceProblemSlugs.medium).toHaveLength(1);
        expect(topic.practiceProblemSlugs.hard).toHaveLength(1);
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
            1 +
            1 +
            1 +
            topic.extraProblemSlugs.length,
          0,
        ) + 3;
      expect(unique.size).toBe(expected);
    }
  });
});
