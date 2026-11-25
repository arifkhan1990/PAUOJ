import { and, eq, isNull, or } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  conversations,
  messageAttachments,
  messages,
} from "@/server/db/schema";
import type {
  MessageDocumentMime,
  MessageImageMime,
  MessageItem,
} from "@/lib/message-types";
import { detectAvatarImage, type DetectedAvatarImage } from "./avatar-image";
import {
  isUuid,
  normalizeMessageCaption,
} from "./message-helpers";
import {
  notBannedCounterpart,
  notBlockedWithViewer,
} from "./message-queries";
import {
  deliverMessage,
  loadMessageSendTarget,
  type MessageViewer,
} from "./message-send";

export const MESSAGE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** 5 MiB file plus multipart framing, checked before the body is buffered. */
export const MESSAGE_IMAGE_MAX_UPLOAD_BYTES =
  MESSAGE_IMAGE_MAX_BYTES + 1024 * 1024;
export const MESSAGE_IMAGE_MAX_DIMENSION = 4096;
export const MESSAGE_IMAGE_RATE_LIMIT = 10;
export const MESSAGE_IMAGE_RATE_WINDOW_SECONDS = 60;
export const MESSAGE_ATTACHMENT_RATE_LIMIT = 240;
export const MESSAGE_ATTACHMENT_RATE_WINDOW_SECONDS = 60;

/**
 * Pre-parse guard: a declared body above 6 MiB (5 MiB file + multipart
 * framing) is rejected before `request.formData()` buffers it. A missing or
 * malformed header returns false; the per-file size check still runs after
 * parsing, so a dishonest header cannot smuggle an oversized image through.
 */
export function uploadExceedsLimit(contentLength: string | null): boolean {
  if (contentLength === null) return false;
  const trimmed = contentLength.trim();
  if (!/^\d+$/.test(trimmed)) return false;
  return Number(trimmed) > MESSAGE_IMAGE_MAX_UPLOAD_BYTES;
}

/**
 * Validates an uploaded message image from its bytes, never from the client
 * MIME type or filename. The same detector backs community avatars.
 */
export function validateMessageImageBytes(
  bytes: Uint8Array,
): DetectedAvatarImage {
  if (bytes.byteLength === 0) {
    throw errors.validation("That file is empty.");
  }
  if (bytes.byteLength > MESSAGE_IMAGE_MAX_BYTES) {
    throw errors.validation("Images must be at most 5 MB.");
  }
  const detected = detectAvatarImage(bytes);
  if (!detected) {
    throw errors.validation("Use a PNG, JPG or WebP image.");
  }
  if (
    detected.width > MESSAGE_IMAGE_MAX_DIMENSION ||
    detected.height > MESSAGE_IMAGE_MAX_DIMENSION
  ) {
    throw errors.validation(
      `Images must be at most ${MESSAGE_IMAGE_MAX_DIMENSION}×${MESSAGE_IMAGE_MAX_DIMENSION} pixels.`,
    );
  }
  return detected;
}

/**
 * Mirrors sendMessage: same uuid/participant/banned/block checks, one
 * transaction, one unread burst notification. The caption may be empty.
 */
export async function sendMessageImage(
  viewer: MessageViewer,
  conversationId: string,
  bytes: Uint8Array,
  caption: string,
): Promise<MessageItem> {
  const image = validateMessageImageBytes(bytes);
  const normalizedCaption = normalizeMessageCaption(caption);
  const target = await loadMessageSendTarget(viewer.id, conversationId);
  return deliverMessage({
    viewer,
    target,
    body: normalizedCaption,
    attachment: { kind: "IMAGE", ...image, bytes },
  });
}

export type MessageImageAttachmentBytes = {
  kind: "IMAGE";
  mime: MessageImageMime;
  fileName: null;
  bytes: Uint8Array;
};

export type MessageDocumentAttachmentBytes = {
  kind: "DOCUMENT";
  mime: MessageDocumentMime;
  fileName: string;
  bytes: Uint8Array;
};

export type MessageAttachmentBytes =
  | MessageImageAttachmentBytes
  | MessageDocumentAttachmentBytes;

/**
 * Bytes stay hidden for malformed ids, deleted messages, and blocked pairs.
 * The viewer must be a participant of the attachment's conversation. Both
 * image and document rows resolve here so the download route has one gate.
 */
export async function getMessageAttachment(
  viewerId: string,
  attachmentId: string,
): Promise<MessageAttachmentBytes | null> {
  if (!isUuid(attachmentId)) return null;
  const [row] = await getDb()
    .select({
      kind: messageAttachments.kind,
      mime: messageAttachments.mime,
      fileName: messageAttachments.fileName,
      bytes: messageAttachments.bytes,
    })
    .from(messageAttachments)
    .innerJoin(messages, eq(messages.id, messageAttachments.messageId))
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .where(
      and(
        eq(messageAttachments.id, attachmentId),
        or(
          eq(conversations.userAId, viewerId),
          eq(conversations.userBId, viewerId),
        ),
        notBlockedWithViewer(viewerId),
        notBannedCounterpart(viewerId),
        isNull(messages.deletedAt),
      ),
    )
    .limit(1);
  if (!row) return null;
  if (row.kind === "DOCUMENT") {
    if (!row.fileName) return null;
    return {
      kind: "DOCUMENT",
      mime: row.mime as MessageDocumentMime,
      fileName: row.fileName,
      bytes: row.bytes,
    };
  }
  return {
    kind: "IMAGE",
    mime: row.mime as MessageImageMime,
    fileName: null,
    bytes: row.bytes,
  };
}
