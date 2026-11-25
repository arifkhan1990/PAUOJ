import { describe, expect, it } from "vitest";
import type { ConversationUserRow } from "./message-queries";
import type { MessageRow } from "./message-helpers";
import {
  getConversationSummary,
  toConversationSummary,
  type ConversationSummarySource,
} from "./message-summary";
import { getConversationSummary as getConversationSummaryFromMessages } from "./messages";

const VIEWER = "6f8a1f34-3d4b-4f7e-9a51-2d3c4b5a6e70";
const PEER = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

function summaryParticipant(
  overrides: Partial<ConversationUserRow> = {},
): ConversationUserRow {
  return {
    id: PEER,
    username: "ayesha",
    displayName: "Ayesha",
    lastActiveAt: null,
    presenceVisibility: "EVERYONE",
    notifyMessages: true,
    avatarPreset: null,
    avatarImageUpdatedAt: null,
    isBanned: false,
    bio: null,
    institution: null,
    country: null,
    currentStatus: null,
    companyName: null,
    jobTitle: null,
    skills: null,
    rating: 1500,
    role: "USER",
    createdAt: new Date("2025-03-04T05:06:07.000Z"),
    website: null,
    github: null,
    linkedin: null,
    ...overrides,
  };
}

function summarySource(
  overrides: Partial<ConversationSummarySource> = {},
): ConversationSummarySource {
  return {
    id: "conv-1",
    participant: summaryParticipant(),
    lastMessageAt: new Date("2026-02-05T10:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    lastMessage: null,
    unreadCount: 3,
    presence: { state: "ONLINE", label: "Online now" },
    muted: false,
    ...overrides,
  };
}

function messageRow(): MessageRow {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    body: "",
    senderId: VIEWER,
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
    readAt: null,
    deletedAt: null,
    attachment: null,
  };
}

describe("conversation summary mapping", () => {
  it("maps the pinned summary with the inbox row shape", () => {
    const summary = toConversationSummary(
      summarySource({
        participant: summaryParticipant({
          avatarPreset: "aurora",
          avatarImageUpdatedAt: new Date("2026-02-01T00:00:00.000Z"),
        }),
      }),
      VIEWER,
    );

    expect(summary).toEqual({
      id: "conv-1",
      username: "ayesha",
      displayName: "Ayesha",
      unreadCount: 3,
      lastMessage: null,
      lastMessageAt: "2026-02-05T10:00:00.000Z",
      presence: { state: "ONLINE", label: "Online now" },
      muted: false,
      avatarPreset: "aurora",
      avatarImageUpdatedAt: "2026-02-01T00:00:00.000Z",
    });
  });

  it("forces unread to zero for a muted conversation", () => {
    expect(
      toConversationSummary(
        summarySource({ muted: true, unreadCount: 9 }),
        VIEWER,
      ).unreadCount,
    ).toBe(0);
  });

  it("falls back to createdAt when the conversation has no message", () => {
    expect(
      toConversationSummary(summarySource({ lastMessageAt: null }), VIEWER)
        .lastMessageAt,
    ).toBe("2026-01-01T00:00:00.000Z");
  });

  it("carries image attachment fields into the last message", () => {
    const lastMessage: MessageRow = {
      ...messageRow(),
      attachment: {
        kind: "IMAGE",
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        mime: "image/png",
        width: 800,
        height: 600,
      },
    };
    expect(
      toConversationSummary(summarySource({ lastMessage }), VIEWER).lastMessage,
    ).toMatchObject({
      mine: true,
      hasAttachment: true,
      attachmentKind: "IMAGE",
      attachmentName: null,
    });
  });

  it("carries document attachment fields into the last message", () => {
    const lastMessage: MessageRow = {
      ...messageRow(),
      senderId: PEER,
      attachment: {
        kind: "DOCUMENT",
        id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        mime: "application/pdf",
        fileName: "Lab report.pdf",
        sizeBytes: 2048,
      },
    };
    expect(
      toConversationSummary(summarySource({ lastMessage }), VIEWER).lastMessage,
    ).toMatchObject({
      mine: false,
      hasAttachment: true,
      attachmentKind: "DOCUMENT",
      attachmentName: "Lab report.pdf",
    });
  });
});

describe("getConversationSummary visibility", () => {
  it("is re-exported from the messages service", () => {
    expect(getConversationSummaryFromMessages).toBe(getConversationSummary);
  });

  it("treats a malformed id as a missing conversation without a query", async () => {
    await expect(
      getConversationSummary(VIEWER, "not-a-uuid"),
    ).resolves.toBeNull();
  });
});
