import { describe, expect, it } from "vitest";
import { DISCUSSION_SNIPPET_MAX, discussionSnippet } from "./discussion-notifications";

describe("discussionSnippet", () => {
  it("collapses whitespace and trims", () => {
    expect(discussionSnippet("  nice \n solution\tthanks  ")).toBe(
      "nice solution thanks",
    );
  });

  it("keeps short replies untouched", () => {
    const body = "Try a prefix sum over the sorted array.";
    expect(discussionSnippet(body)).toBe(body);
  });

  it("shortens long replies to the limit including the ellipsis", () => {
    const body = "a".repeat(500);
    const snippet = discussionSnippet(body);
    expect(snippet.length).toBe(DISCUSSION_SNIPPET_MAX);
    expect(snippet.endsWith("…")).toBe(true);
  });

  it("respects a custom limit", () => {
    expect(discussionSnippet("abcdefgh", 5)).toBe("abcd…");
  });

  it("handles an empty body", () => {
    expect(discussionSnippet("   ")).toBe("");
  });
});
