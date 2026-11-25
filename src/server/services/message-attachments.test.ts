import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/api/errors";
import {
  attachmentPreviewLabel,
  messageNotificationBody,
  normalizeMessageCaption,
  toAttachmentRow,
  toLastMessagePreview,
  toMessageItem,
  NOTIFICATION_PREVIEW_LENGTH,
  type MessageAttachmentRow,
  type MessageRow,
} from "./message-helpers";

const VIEWER = "6f8a1f34-3d4b-4f7e-9a51-2d3c4b5a6e70";
const PEER = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

const IMAGE_ATTACHMENT: MessageAttachmentRow = {
  kind: "IMAGE",
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  mime: "image/png",
  width: 640,
  height: 480,
};

const DOCUMENT_ATTACHMENT: MessageAttachmentRow = {
  kind: "DOCUMENT",
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  mime: "application/pdf",
  fileName: "Lab report.pdf",
  sizeBytes: 2048,
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

describe("message attachment mapping", () => {
  it("maps an image to an inline participant-only URL", () => {
    expect(
      toMessageItem(messageRow({ attachment: IMAGE_ATTACHMENT }), VIEWER)
        .attachment,
    ).toEqual({
      ...IMAGE_ATTACHMENT,
      url: `/api/v1/messages/attachments/${IMAGE_ATTACHMENT.id}`,
    });
  });

  it("maps a document to a download URL with its own metadata", () => {
    expect(
      toMessageItem(messageRow({ attachment: DOCUMENT_ATTACHMENT }), VIEWER)
        .attachment,
    ).toEqual({
      ...DOCUMENT_ATTACHMENT,
      url: `/api/v1/messages/attachments/${DOCUMENT_ATTACHMENT.id}`,
    });
  });

  it("drops flat rows that do not match their kind", () => {
    expect(
      toAttachmentRow({
        attachmentId: "id",
        attachmentKind: "IMAGE",
        attachmentMime: "image/png",
        attachmentWidth: null,
        attachmentHeight: null,
        attachmentFileName: null,
        attachmentSizeBytes: 0,
      }),
    ).toBeNull();
    expect(
      toAttachmentRow({
        attachmentId: "id",
        attachmentKind: "DOCUMENT",
        attachmentMime: "application/pdf",
        attachmentWidth: null,
        attachmentHeight: null,
        attachmentFileName: null,
        attachmentSizeBytes: 10,
      }),
    ).toBeNull();
    expect(
      toAttachmentRow({
        attachmentId: null,
        attachmentKind: null,
        attachmentMime: null,
        attachmentWidth: null,
        attachmentHeight: null,
        attachmentFileName: null,
        attachmentSizeBytes: null,
      }),
    ).toBeNull();
  });
});

describe("inbox previews", () => {
  it("reports an image and its kind on the inbox preview", () => {
    expect(
      toLastMessagePreview(messageRow({ attachment: IMAGE_ATTACHMENT }), VIEWER),
    ).toMatchObject({
      hasAttachment: true,
      attachmentKind: "IMAGE",
      attachmentName: null,
      deleted: false,
    });
  });

  it("reports a document name on the inbox preview", () => {
    expect(
      toLastMessagePreview(
        messageRow({ attachment: DOCUMENT_ATTACHMENT }),
        VIEWER,
      ),
    ).toEqual({
      body: "",
      mine: true,
      createdAt: "2026-01-02T03:04:05.000Z",
      deleted: false,
      hasAttachment: true,
      attachmentKind: "DOCUMENT",
      attachmentName: "Lab report.pdf",
    });
  });

  it("reports no attachment for a text message", () => {
    expect(toLastMessagePreview(messageRow(), VIEWER)).toMatchObject({
      hasAttachment: false,
      attachmentKind: null,
      attachmentName: null,
    });
  });

  it("never exposes an attachment once the message is deleted", () => {
    const deleted = toMessageItem(
      messageRow({ attachment: DOCUMENT_ATTACHMENT, deletedAt: new Date() }),
      VIEWER,
    );
    expect(deleted.attachment).toBeNull();
    expect(deleted.body).toBe("");
    const preview = toLastMessagePreview(
      messageRow({ attachment: DOCUMENT_ATTACHMENT, deletedAt: new Date() }),
      VIEWER,
    );
    expect(preview).toMatchObject({
      hasAttachment: false,
      attachmentKind: null,
      attachmentName: null,
      deleted: true,
    });
  });

  it("keeps mine false for the peer's message", () => {
    expect(
      toLastMessagePreview(
        { ...messageRow({ attachment: DOCUMENT_ATTACHMENT }), senderId: PEER },
        VIEWER,
      ),
    ).toMatchObject({ mine: false, hasAttachment: true });
  });
});

describe("image and document captions", () => {
  it("allows an empty caption for a file-only message", () => {
    expect(normalizeMessageCaption("   ")).toBe("");
    expect(normalizeMessageCaption(" hi ")).toBe("hi");
    expect(normalizeMessageCaption("a".repeat(2000))).toHaveLength(2000);
    expect(() => normalizeMessageCaption("a".repeat(2001))).toThrowError(
      ApiError,
    );
  });

  it("falls back to '📷 Photo' for an uncaptioned image", () => {
    expect(
      messageNotificationBody({
        body: "",
        hasAttachment: true,
        attachmentKind: "IMAGE",
      }),
    ).toBe("📷 Photo");
  });

  it("falls back to '📎 <fileName>' for an uncaptioned document", () => {
    expect(
      messageNotificationBody({
        body: "   ",
        hasAttachment: true,
        attachmentKind: "DOCUMENT",
        attachmentName: "Lab report.pdf",
      }),
    ).toBe("📎 Lab report.pdf");
  });

  it("caps a document preview at the notification length", () => {
    const label = attachmentPreviewLabel(
      "DOCUMENT",
      `${"ر".repeat(200)}.pdf`,
    );
    expect(label.length).toBeLessThanOrEqual(NOTIFICATION_PREVIEW_LENGTH);
    expect(label.startsWith("📎 ")).toBe(true);
  });

  it("prefers the caption when one exists", () => {
    expect(
      messageNotificationBody({
        body: "  look at this  ",
        hasAttachment: true,
        attachmentKind: "DOCUMENT",
        attachmentName: "Lab report.pdf",
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
