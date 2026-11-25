import { describe, expect, it } from "vitest";
import {
  EMOJI_GROUPS,
  countEmoji,
  filterEmojiGroups,
  type EmojiGroup,
} from "./emoji-data";

function chars(groups: readonly EmojiGroup[]): string[] {
  return groups.flatMap((group) => group.items.map((item) => item.char));
}

function names(groups: readonly EmojiGroup[]): string[] {
  return groups.flatMap((group) => group.items.map((item) => item.name));
}

describe("EMOJI_GROUPS", () => {
  it("ships at least 120 curated emoji", () => {
    expect(countEmoji(EMOJI_GROUPS)).toBeGreaterThanOrEqual(120);
  });

  it("has unique characters across all groups", () => {
    const all = chars(EMOJI_GROUPS);
    expect(new Set(all).size).toBe(all.length);
  });

  it("keeps the expected group labels and no empty groups", () => {
    expect(EMOJI_GROUPS.map((group) => group.label)).toEqual([
      "Smileys",
      "Gestures",
      "Symbols",
      "Food & Nature",
      "Objects",
    ]);
    expect(EMOJI_GROUPS.every((group) => group.items.length > 0)).toBe(true);
  });
});

describe("filterEmojiGroups", () => {
  it("returns every emoji for an empty or whitespace query", () => {
    expect(countEmoji(filterEmojiGroups(EMOJI_GROUPS, ""))).toBe(
      countEmoji(EMOJI_GROUPS),
    );
    expect(countEmoji(filterEmojiGroups(EMOJI_GROUPS, "   "))).toBe(
      countEmoji(EMOJI_GROUPS),
    );
  });

  it("matches a single word inside the emoji name", () => {
    expect(chars(filterEmojiGroups(EMOJI_GROUPS, "rocket"))).toEqual(["🚀"]);
    expect(names(filterEmojiGroups(EMOJI_GROUPS, "laugh"))).toContain(
      "rolling on the floor laughing",
    );
  });

  it("finds every heart emoji by name", () => {
    const result = filterEmojiGroups(EMOJI_GROUPS, "heart");
    const resultNames = names(result);

    expect(resultNames).toContain("red heart");
    expect(resultNames).toContain("broken heart");
    expect(resultNames).toContain("smiling face with heart eyes");
    expect(result.every((group) => group.items.length > 0)).toBe(true);
    expect(result.every((group) => group.label === "Symbols" || group.label === "Smileys")).toBe(
      true,
    );
  });

  it("requires every token to match for multi-word queries", () => {
    expect(chars(filterEmojiGroups(EMOJI_GROUPS, "red heart"))).toEqual(["❤️"]);
    expect(chars(filterEmojiGroups(EMOJI_GROUPS, "thumbs up"))).toEqual(["👍"]);
    expect(chars(filterEmojiGroups(EMOJI_GROUPS, "thumbs down"))).toEqual(["👎"]);
    expect(filterEmojiGroups(EMOJI_GROUPS, "red rocket")).toEqual([]);
  });

  it("is case-insensitive and ignores surrounding whitespace", () => {
    expect(filterEmojiGroups(EMOJI_GROUPS, "ROCKET")).toEqual(
      filterEmojiGroups(EMOJI_GROUPS, "  rocket  "),
    );
  });

  it("matches by emoji character", () => {
    expect(chars(filterEmojiGroups(EMOJI_GROUPS, "🚀"))).toEqual(["🚀"]);
  });

  it("drops empty groups and returns no groups for an unknown query", () => {
    const result = filterEmojiGroups(EMOJI_GROUPS, "zzzz-not-an-emoji");
    expect(result).toEqual([]);
  });
});
