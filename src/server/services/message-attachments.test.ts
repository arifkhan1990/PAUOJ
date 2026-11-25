import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/api/errors";
import {
  messageNotificationBody,
  normalizeMessageCaption,
  toLastMessagePreview,
  toMessageItem,
  type MessageRow,
} from "./message-helpers";

const VIEWER = "6f8a1f34-3d4b-4f7e-9a51-2d3c4b5a6e70";
const PEER = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

const ATTACHMENT = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  mime: "image/png" as const,
  width: 640,
  height: 480,
};

function messageRow(
  overrides: Partial<{
    deletedAt: Date | null;
    attachment: MessageRow["attachment"];
  }> = {},
): MessageRow {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    body: "",
    senderId: VIEWER,
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
    readAt: null,
    deletedAt: overrides.deletedAt ?? null,
    attachment: overrides.attachment ?? null,
  };
}

describe("message attachments", () => {
  it("maps an attachment to a participant-only URL", () => {
    expect(
      toMessageItem(messageRow({ attachment: ATTACHMENT }), VIEWER).attachment,
    ).toEqual({
      ...ATTACHMENT,
      url: `/api/v1/messages/attachments/${ATTACHMENT.id}`,
    });
  });

  it("reports an image on the inbox preview", () => {
    expect(
      toLastMessagePreview(messageRow({ attachment: ATTACHMENT }), VIEWER),
    ).toMatchObject({ hasAttachment: true, deleted: false });
    expect(
      toLastMessagePreview(messageRow({ attachment: null }), VIEWER),
    ).toMatchObject({ hasAttachment: false });
  });

  it("never exposes an attachment once the message is deleted", () => {
    const deleted = toMessageItem(
      messageRow({ attachment: ATTACHMENT, deletedAt: new Date() }),
      VIEWER,
    );
    expect(deleted.attachment).toBeNull();
    expect(deleted.body).toBe("");
    expect(
      toLastMessagePreview(
        messageRow({ attachment: ATTACHMENT, deletedAt: new Date() }),
        VIEWER,
      )?.hasAttachment,
    ).toBe(false);
  });

  it("does not attach a photo to someone else's message preview", () => {
    expect(
      toLastMessagePreview(messageRow({ attachment: ATTACHMENT }), PEER),
    ).toMatchObject({ hasAttachment: true, mine: false });
  });
});

describe("image captions and photo previews", () => {
  it("allows an empty caption for an image-only message", () => {
    expect(normalizeMessageCaption("   ")).toBe("");
    expect(normalizeMessageCaption(" hi ")).toBe("hi");
    expect(normalizeMessageCaption("a".repeat(2000))).toHaveLength(2000);
    expect(() => normalizeMessageCaption("a".repeat(2001))).toThrowError(
      ApiError,
    );
  });

  it("falls back to '📷 Photo' when an image has no caption", () => {
    expect(messageNotificationBody({ body: "", hasAttachment: true })).toBe(
      "📷 Photo",
    );
  });

  it("prefers the caption when an image has one", () => {
    expect(
      messageNotificationBody({
        body: "  look at this  ",
        hasAttachment: true,
      }),
    ).toBe("look at this");
  });

  it("renders reference tokens readably and truncates", () => {
    expect(
      messageNotificationBody({
        body: "@[PAU Cup 2026](/contests/pau-cup-2026)",
        hasAttachment: false,
      }),
    ).toBe("@PAU Cup 2026");
    expect(
      messageNotificationBody({ body: "a".repeat(200), hasAttachment: false }),
    ).toHaveLength(120);
  });
});
