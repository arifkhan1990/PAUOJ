import { describe, expect, it } from "vitest";
import { LEARNING_MODULES } from "./modules";
import { LEARNING_ROUTE_SLUGS, isLearningRoute } from "./route-slugs";

describe("learning route index", () => {
  it("matches every module and topic in the curriculum", () => {
    const expected = Object.fromEntries(
      LEARNING_MODULES.map((module) => [
        module.slug,
        module.topics.map((topic) => topic.slug),
      ]),
    );
    expect(LEARNING_ROUTE_SLUGS).toEqual(expected);
  });

  it("rejects unknown modules and topics", () => {
    expect(isLearningRoute("basic-programming-math")).toBe(true);
    expect(isLearningRoute("basic-programming-math", "complexity")).toBe(true);
    expect(isLearningRoute("not-a-track")).toBe(false);
    expect(isLearningRoute("basic-programming-math", "not-a-topic")).toBe(false);
  });
});
