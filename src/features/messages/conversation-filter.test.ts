import { describe, expect, it } from "vitest";
import type { ConversationSummary } from "@/lib/message-types";
import {
  conversationFilterCounts,
  conversationMatches,
  filterConversations,
} from "./conversation-filter";

function conversation(
  overrides: Partial<ConversationSummary> & { id: string },
): ConversationSummary {
  return {
    username: "coder",
    displayName: "Coder One",
    unreadCount: 0,
    lastMessage: {
      body: "hello there",
      mine: false,
      createdAt: "2026-11-25T10:00:00.000Z",
      deleted: false,
      hasAttachment: false,
    },
    lastMessageAt: "2026-11-25T10:00:00.000Z",
    presence: { state: "HIDDEN", label: null },
    muted: false,
    avatarPreset: null,
    avatarImageUpdatedAt: null,
    ...overrides,
  };
}

const ANNA = conversation({
  id: "anna",
  username: "anna",
  displayName: "Anna Rahman",
  unreadCount: 2,
});
const BOB = conversation({
  id: "bob",
  username: "bob_dev",
  displayName: "Bob",
  lastMessage: {
    body: "Graph theory contest prep",
    mine: true,
    createdAt: "2026-11-25T09:00:00.000Z",
    deleted: false,
    hasAttachment: false,
  },
});
const MUTED = conversation({
  id: "muted",
  username: "quiet",
  displayName: "Quiet Coder",
  unreadCount: 4,
  muted: true,
  lastMessage: null,
});

describe("conversationMatches", () => {
  it("matches display name, username and last-message preview", () => {
    expect(conversationMatches(ANNA, "anna rahman")).toBe(true);
    expect(conversationMatches(ANNA, "@ANNA")).toBe(true);
    expect(conversationMatches(BOB, "graph theory")).toBe(true);
    expect(conversationMatches(BOB, "}}{{")).toBe(false);
  });

  it("treats an empty query as a match", () => {
    expect(conversationMatches(BOB, "   ")).toBe(true);
  });
});

describe("filterConversations", () => {
  const all = [ANNA, BOB, MUTED];

  it("keeps every loaded row for the All tab", () => {
    expect(filterConversations(all, "all", "")).toHaveLength(3);
  });

  it("shows only rows with a visible unread count", () => {
    const unread = filterConversations(all, "unread", "");
    expect(unread.map((item) => item.id)).toEqual(["anna"]);
  });

  it("combines the filter with the search query", () => {
    expect(filterConversations(all, "unread", "bob")).toEqual([]);
    expect(filterConversations(all, "all", "bob").map((item) => item.id)).toEqual(
      ["bob"],
    );
  });
});

describe("conversationFilterCounts", () => {
  it("counts the loaded page and ignores muted unread counts", () => {
    expect(conversationFilterCounts([ANNA, BOB, MUTED])).toEqual({
      all: 3,
      unread: 1,
    });
  });
});
