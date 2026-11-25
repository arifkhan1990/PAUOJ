import { describe, expect, it } from "vitest";
import type { ConversationSummary } from "@/lib/message-types";
import { railClassName, withPinnedConversation } from "./messages-layout";

function conversation(id: string): ConversationSummary {
  return {
    id,
    username: id,
    displayName: `Coder ${id}`,
    unreadCount: 0,
    lastMessage: {
      body: "hello",
      mine: false,
      createdAt: "2026-11-25T10:00:00.000Z",
      deleted: false,
      hasAttachment: false,
      attachmentKind: null,
      attachmentName: null,
    },
    lastMessageAt: "2026-11-25T10:00:00.000Z",
    presence: { state: "HIDDEN", label: null },
    muted: false,
    avatarPreset: null,
    avatarImageUpdatedAt: null,
  };
}

describe("withPinnedConversation", () => {
  it("returns the page untouched without a pinned conversation", () => {
    const page = [conversation("a"), conversation("b")];
    expect(withPinnedConversation(page, null).map((item) => item.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("pins an older active conversation on top", () => {
    const page = [conversation("a"), conversation("b")];
    const pinned = conversation("old");
    expect(
      withPinnedConversation(page, pinned).map((item) => item.id),
    ).toEqual(["old", "a", "b"]);
  });

  it("does not duplicate a conversation that is already on the page", () => {
    const page = [conversation("a"), conversation("b")];
    const merged = withPinnedConversation(page, conversation("b"));
    expect(merged.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the input page", () => {
    const page = [conversation("a")];
    withPinnedConversation(page, conversation("old"));
    expect(page.map((item) => item.id)).toEqual(["a"]);
  });
});

describe("railClassName", () => {
  it("uses the rail as the inbox page", () => {
    expect(railClassName(false, false)).toBe("flex");
  });

  it("hides the rail on a phone thread and shows it from md", () => {
    expect(railClassName(true, false)).toBe("hidden md:flex");
  });

  it("keeps only the xl rail while the info panel is open", () => {
    expect(railClassName(true, true)).toBe("hidden xl:flex");
  });
});
