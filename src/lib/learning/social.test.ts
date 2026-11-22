import { describe, expect, it } from "vitest";
import { nextReactionValue } from "@/lib/learning/social";

describe("nextReactionValue", () => {
  it("sets the clicked reaction when nothing was selected", () => {
    expect(nextReactionValue(0, 1)).toBe(1);
    expect(nextReactionValue(0, -1)).toBe(-1);
  });

  it("switches between like and dislike", () => {
    expect(nextReactionValue(1, -1)).toBe(-1);
    expect(nextReactionValue(-1, 1)).toBe(1);
  });

  it("clears the reaction when the active one is clicked again", () => {
    expect(nextReactionValue(1, 1)).toBe(0);
    expect(nextReactionValue(-1, -1)).toBe(0);
  });
});
