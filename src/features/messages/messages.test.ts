import { describe, expect, it } from "vitest";
import type { ConversationSummary, MessageItem } from "@/lib/message-types";
import {
  conversationPreview,
  conversationRowState,
  formatMessageTime,
  isUuid,
  mergeMessages,
  muteToggleState,
  newIncomingMessages,
  truncatePreview,
  unreadLabel,
} from "./message-format";

const NOW = new Date("2026-11-25T12:00:00Z");

function message(overrides: Partial<MessageItem> & { id: string }): MessageItem {
  return {
    body: "hello",
    mine: false,
    createdAt: "2026-11-25T11:00:00.000Z",
    readAt: null,
    deleted: false,
    attachment: null,
    ...overrides,
  };
}

describe("formatMessageTime", () => {
  it("formats recent activity relative to now", () => {
    expect(formatMessageTime("2026-11-25T11:59:40Z", NOW)).toBe("just now");
    expect(formatMessageTime("2026-11-25T11:52:00Z", NOW)).toBe("8m ago");
    expect(formatMessageTime("2026-11-25T09:00:00Z", NOW)).toBe("3h ago");
    expect(formatMessageTime("2026-11-23T12:00:00Z", NOW)).toBe("2d ago");
  });

  it("falls back to an absolute UTC date after a week", () => {
    expect(formatMessageTime("2026-11-01T12:00:00Z", NOW)).toBe("01 Nov 2026");
  });

  it("clamps future timestamps and ignores invalid input", () => {
    expect(formatMessageTime("2026-11-25T12:05:00Z", NOW)).toBe("just now");
    expect(formatMessageTime("not-a-date", NOW)).toBe("");
  });
});

describe("truncatePreview", () => {
  it("collapses whitespace and newlines onto one line", () => {
    expect(truncatePreview("  line one\nline two  ")).toBe("line one line two");
  });

  it("ellipsizes long bodies with a single character", () => {
    const result = truncatePreview("abcdefghij", 5);
    expect(result).toBe("abcd…");
    expect(Array.from(result)).toHaveLength(5);
  });

  it("leaves short bodies untouched", () => {
    expect(truncatePreview("short", 10)).toBe("short");
  });
});

describe("conversationPreview", () => {
  const base: ConversationSummary["lastMessage"] = {
    body: "See you at the contest",
    mine: false,
    createdAt: "2026-11-25T11:00:00.000Z",
    deleted: false,
    hasAttachment: false,
  };

  it("handles an empty conversation", () => {
    expect(conversationPreview(null)).toBe("No messages yet");
  });

  it("marks deleted messages", () => {
    expect(conversationPreview({ ...base, deleted: true })).toBe(
      "Message deleted",
    );
    expect(
      conversationPreview({ ...base, deleted: true, hasAttachment: true }),
    ).toBe("Message deleted");
  });

  it("prefixes the viewer's own messages with You:", () => {
    expect(conversationPreview({ ...base, mine: true })).toBe(
      "You: See you at the contest",
    );
    expect(conversationPreview(base)).toBe("See you at the contest");
  });

  it("labels image-only messages as a photo", () => {
    expect(conversationPreview({ ...base, body: "", hasAttachment: true })).toBe(
      "📷 Photo",
    );
    expect(
      conversationPreview({ ...base, body: "", hasAttachment: true, mine: true }),
    ).toBe("You: 📷 Photo");
  });

  it("keeps the caption for an image that has one", () => {
    expect(
      conversationPreview({ ...base, body: "Look at this", hasAttachment: true }),
    ).toBe("Look at this");
  });

  it("expands reference tokens before truncating", () => {
    expect(
      conversationPreview({
        ...base,
        body: "Join @[PAU Cup 2026](/contests/pau-cup-2026) now",
      }),
    ).toBe("Join @PAU Cup 2026 now");
  });

  it("truncates the expanded reference preview, not the raw token", () => {
    const preview = conversationPreview(
      {
        ...base,
        body: "Join @[PAU Cup 2026](/contests/pau-cup-2026) now",
      },
      12,
    );
    expect(Array.from(preview)).toHaveLength(12);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview).not.toContain("](/");
  });

  it("falls back to a neutral label for an empty non-photo body", () => {
    expect(conversationPreview({ ...base, body: "   " })).toBe("Message");
  });
});

describe("unreadLabel", () => {
  it("returns null when nothing is unread", () => {
    expect(unreadLabel(0)).toBeNull();
    expect(unreadLabel(-3)).toBeNull();
  });

  it("pluralizes correctly", () => {
    expect(unreadLabel(1)).toBe("1 unread message");
    expect(unreadLabel(4)).toBe("4 unread messages");
  });
});

describe("conversationRowState", () => {
  it("shows the unread badge for an unmuted conversation", () => {
    expect(conversationRowState(false, 3)).toEqual({
      muted: false,
      unread: 3,
      showUnreadBadge: true,
    });
  });

  it("suppresses a stale unread count while muted", () => {
    expect(conversationRowState(true, 7)).toEqual({
      muted: true,
      unread: 0,
      showUnreadBadge: false,
    });
  });

  it("treats invalid counts as zero", () => {
    expect(conversationRowState(false, Number.NaN).showUnreadBadge).toBe(false);
    expect(conversationRowState(false, -5).unread).toBe(0);
  });
});

describe("muteToggleState", () => {
  it("mutes an unmuted conversation with a POST", () => {
    expect(muteToggleState(false)).toMatchObject({
      nextMuted: true,
      method: "POST",
      label: "Mute conversation",
    });
  });

  it("unmutes a muted conversation with a DELETE", () => {
    expect(muteToggleState(true)).toMatchObject({
      nextMuted: false,
      method: "DELETE",
      label: "Unmute conversation",
    });
  });
});

describe("mergeMessages", () => {
  it("dedupes by id and sorts oldest first", () => {
    const first = message({ id: "b", createdAt: "2026-11-25T11:02:00.000Z" });
    const second = message({ id: "a", createdAt: "2026-11-25T11:00:00.000Z" });
    const merged = mergeMessages([first], [second, first]);
    expect(merged.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("lets the fresher server copy update read receipts", () => {
    const before = message({ id: "m1", mine: true, readAt: null });
    const after = message({
      id: "m1",
      mine: true,
      readAt: "2026-11-25T11:30:00.000Z",
    });
    const merged = mergeMessages([before], [after]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.readAt).toBe("2026-11-25T11:30:00.000Z");
  });

  it("does not mutate the inputs", () => {
    const current = [message({ id: "one" })];
    mergeMessages(current, [message({ id: "two" })]);
    expect(current.map((item) => item.id)).toEqual(["one"]);
  });
});

describe("newIncomingMessages", () => {
  it("returns only unseen messages from the other side", () => {
    const known = [message({ id: "seen" })];
    const polled = [
      message({ id: "seen" }),
      message({ id: "theirs", createdAt: "2026-11-25T11:05:00.000Z" }),
      message({ id: "mine", mine: true, createdAt: "2026-11-25T11:06:00.000Z" }),
    ];
    expect(newIncomingMessages(known, polled).map((item) => item.id)).toEqual([
      "theirs",
    ]);
  });
});

describe("isUuid", () => {
  it("accepts canonical UUIDs and rejects other ids", () => {
    expect(isUuid("3f0f3c1e-6a9b-4b0e-9d5e-1c2a3b4c5d6e")).toBe(true);
    expect(isUuid("3f0f3c1e-6a9b-4b0e-9d5e")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
