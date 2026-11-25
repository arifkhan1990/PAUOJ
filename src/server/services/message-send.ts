import { and, eq, or } from "drizzle-orm";
import { getDb, type Database } from "@/server/db";
import {
  conversations,
  messageAttachments,
  messages,
  userBlocks,
} from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import type {
  MessageDocumentMime,
  MessageImageMime,
  MessageItem,
} from "@/lib/message-types";
import { logger } from "@/server/logger";
import {
  conversationHref,
  isParticipant,
  isUuid,
  messageDedupeKey,
  messageNotificationBody,
  messageNotificationTitle,
  otherParticipantId,
  shouldNotifyMessage,
  toMessageItem,
  type MessageAttachmentRow,
} from "./message-helpers";
import {
  conversationForViewer,
  hasUnreadFromSender,
  type ConversationUserRow,
} from "./message-queries";
import { isMuted } from "./conversation-mutes";
import {
  assertAttachmentQuota,
  lockAttachmentQuota,
} from "./message-attachment-quota";
import { notifyUser } from "./notifications";
import { lockUserPair } from "./social-lock";
import { isBlockedEitherWay } from "./user-blocks";
import { invalidateUnreadCache } from "./message-unread-cache";

export type MessageViewer = {
  id: string;
  username: string;
  displayName: string;
};

export type MessageSendTarget = {
  conversationId: string;
  recipientId: string;
  recipient: ConversationUserRow;
};

/**
 * Shared send preconditions for text, image and document messages: the
 * conversation exists, the viewer participates, the counterpart is not banned,
 * and no block exists in either direction.
 */
export async function loadMessageSendTarget(
  viewerId: string,
  conversationId: string,
): Promise<MessageSendTarget> {
  if (!isUuid(conversationId)) {
    throw errors.notFound("Conversation not found.");
  }
  const conversation = await conversationForViewer(conversationId, viewerId);
  if (!conversation || !isParticipant(conversation, viewerId)) {
    throw errors.notFound("Conversation not found.");
  }
  const recipientId = otherParticipantId(conversation, viewerId);
  if (!recipientId) throw errors.notFound("Conversation not found.");
  const recipient = conversation.userAId === viewerId
    ? conversation.userB
    : conversation.userA;
  if (recipient.isBanned) {
    throw errors.notFound("Conversation not found.");
  }
  if (await isBlockedEitherWay(viewerId, recipientId)) {
    throw errors.forbidden("You cannot send messages in this conversation.");
  }
  return { conversationId, recipientId, recipient };
}

export type NewMessageImageAttachment = {
  kind: "IMAGE";
  mime: MessageImageMime;
  width: number;
  height: number;
  bytes: Uint8Array;
};

export type NewMessageDocumentAttachment = {
  kind: "DOCUMENT";
  mime: MessageDocumentMime;
  fileName: string;
  sizeBytes: number;
  bytes: Uint8Array;
};

export type NewMessageAttachment =
  | NewMessageImageAttachment
  | NewMessageDocumentAttachment;

/**
 * Writes the message row, optional attachment, and conversation timestamp in
 * one transaction, then refreshes the recipient's badge and notices.
 */
export async function deliverMessage(input: {
  viewer: MessageViewer;
  target: MessageSendTarget;
  body: string;
  attachment?: NewMessageAttachment;
}): Promise<MessageItem> {
  const { viewer, target, body, attachment } = input;
  const [recipientMuted, hasUnread] = await Promise.all([
    isMuted(target.recipientId, target.conversationId),
    hasUnreadFromSender(target.conversationId, viewer.id),
  ]);
  const shouldNotify = shouldNotifyMessage({
    recipientNotifyMessages: target.recipient.notifyMessages,
    recipientMuted,
    hasUnreadFromSender: hasUnread,
  });

  const db = getDb();
  const message = await db.transaction(async (tx) => {
    await lockUserPair(tx, viewer.id, target.recipientId);
    const [blocked] = await tx
      .select({ blockerId: userBlocks.blockerId })
      .from(userBlocks)
      .where(
        or(
          and(
            eq(userBlocks.blockerId, viewer.id),
            eq(userBlocks.blockedId, target.recipientId),
          ),
          and(
            eq(userBlocks.blockerId, target.recipientId),
            eq(userBlocks.blockedId, viewer.id),
          ),
        ),
      )
      .limit(1);
    if (blocked) {
      throw errors.forbidden("You cannot send messages in this conversation.");
    }
    // The quota gate sits inside the transaction, after the pair lock/block
    // re-check, so concurrent uploads for one sender cannot overshoot. Images
    // and documents share the same table, so they share both caps.
    if (attachment) {
      await lockAttachmentQuota(tx, viewer.id);
      await assertAttachmentQuota(tx, viewer.id, attachment.bytes.byteLength);
    }
    const [inserted] = await tx
      .insert(messages)
      .values({
        conversationId: target.conversationId,
        senderId: viewer.id,
        body,
      })
      .returning({
        id: messages.id,
        body: messages.body,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
        readAt: messages.readAt,
        deletedAt: messages.deletedAt,
      });
    if (!inserted) {
      throw errors.unavailable("Could not send the message. Please retry.");
    }
    const attachmentRow = attachment
      ? await insertAttachment(tx, inserted.id, attachment)
      : null;
    await tx
      .update(conversations)
      .set({ lastMessageAt: inserted.createdAt, updatedAt: new Date() })
      .where(eq(conversations.id, target.conversationId));
    return { ...inserted, attachment: attachmentRow };
  });

  // The recipient's badge must not keep a pre-send count for the cache window.
  await invalidateUnreadCache(target.recipientId);

  if (shouldNotify) {
    try {
      await notifyUser({
        userId: target.recipientId,
        type: "MESSAGE",
        title: messageNotificationTitle(viewer.displayName),
        body: messageNotificationBody({
          body,
          hasAttachment: Boolean(attachment),
          attachmentKind: attachment?.kind ?? null,
          attachmentName:
            attachment?.kind === "DOCUMENT" ? attachment.fileName : null,
        }),
        href: conversationHref(target.conversationId),
        dedupeKey: messageDedupeKey(message.id),
      });
    } catch (error) {
      logger.warn("Message notification failed", {
        userId: target.recipientId,
        conversationId: target.conversationId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return toMessageItem(message, viewer.id);
}

type MessageTransaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

async function insertAttachment(
  tx: MessageTransaction,
  messageId: string,
  attachment: NewMessageAttachment,
): Promise<MessageAttachmentRow> {
  const [row] = await tx
    .insert(messageAttachments)
    .values(
      attachment.kind === "DOCUMENT"
        ? {
            messageId,
            kind: "DOCUMENT",
            mime: attachment.mime,
            width: null,
            height: null,
            fileName: attachment.fileName,
            sizeBytes: attachment.sizeBytes,
            bytes: Buffer.from(attachment.bytes),
          }
        : {
            messageId,
            kind: "IMAGE",
            mime: attachment.mime,
            width: attachment.width,
            height: attachment.height,
            fileName: null,
            sizeBytes: 0,
            bytes: Buffer.from(attachment.bytes),
          },
    )
    .returning({
      id: messageAttachments.id,
      kind: messageAttachments.kind,
      mime: messageAttachments.mime,
      width: messageAttachments.width,
      height: messageAttachments.height,
      fileName: messageAttachments.fileName,
      sizeBytes: messageAttachments.sizeBytes,
    });
  if (!row) {
    throw errors.unavailable("Could not store the file. Please retry.");
  }
  if (row.kind === "DOCUMENT") {
    if (!row.fileName) {
      throw errors.unavailable("Could not store the file. Please retry.");
    }
    return {
      kind: "DOCUMENT",
      id: row.id,
      mime: row.mime as MessageDocumentMime,
      fileName: row.fileName,
      sizeBytes: row.sizeBytes,
    };
  }
  if (row.width === null || row.height === null) {
    throw errors.unavailable("Could not store the image. Please retry.");
  }
  return {
    kind: "IMAGE",
    id: row.id,
    mime: row.mime as MessageImageMime,
    width: row.width,
    height: row.height,
  };
}
