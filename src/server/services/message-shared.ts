import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { messageAttachments, messages } from "@/server/db/schema";
import type {
  ConversationSharedContent,
  ConversationSharedLink,
  ConversationSharedMedia,
  MessageImageMime,
  MessageParticipantProfile,
} from "@/lib/message-types";
import {
  isParticipant,
  isUuid,
  messageAttachmentUrl,
} from "./message-helpers";
import {
  conversationForViewer,
  type ConversationUserRow,
} from "./message-queries";
import { isBlockedEitherWay } from "./user-blocks";

/** Newest images shown in the info panel's media grid. */
export const SHARED_MEDIA_LIMIT = 24;
/** Bounded scan of recent messages that mention a URL. */
export const SHARED_LINK_MESSAGE_WINDOW = 200;
export const SHARED_LINK_LIMIT = 40;
export const SHARED_LINK_LABEL_MAX = 80;

const DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".zip",
  ".rar",
  ".7z",
] as const;

/**
 * Absolute http(s) URLs only. Anything else (relative reference tokens,
 * `javascript:`, `data:`, `ftp:`) never matches, so the panel cannot link or
 * render a dangerous protocol.
 */
const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/gi;
/** Sentence punctuation after a pasted URL is not part of the URL. */
const TRAILING_PUNCTUATION = /[.,;:!?'"”’…]+$/;

export type SharedLinkSourceRow = {
  body: string;
  senderId: string;
  createdAt: Date;
};

function countCharacter(value: string, character: string): number {
  return value.split(character).length - 1;
}

/**
 * Drops a trailing `)`, `]` or `}` only when it has no matching opener. This
 * keeps `/wiki/Set_(mathematics)` intact while still removing the sentence
 * bracket from `(https://example.com/page)`.
 */
function stripUnbalancedClosers(value: string): string {
  let result = value;
  while (/[)\]}]$/.test(result)) {
    const close = result.slice(-1);
    const open = close === ")" ? "(" : close === "]" ? "[" : "{";
    if (countCharacter(result, close) <= countCharacter(result, open)) break;
    result = result.slice(0, -1);
  }
  return result;
}

/**
 * Canonical form used for display and dedupe: http(s) only, no fragment, and
 * no trailing slash on a bare origin.
 */
export function normalizeSharedUrl(raw: string): string | null {
  const candidate = stripUnbalancedClosers(
    raw.trim().replace(TRAILING_PUNCTUATION, ""),
  );
  if (candidate.length === 0) return null;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (parsed.hostname.length === 0) return null;

  parsed.hash = "";
  const normalized = parsed.toString();
  return parsed.pathname === "/" && parsed.search === ""
    ? normalized.slice(0, -1)
    : normalized;
}

/** Every unique http(s) URL in a body, in the order it appears. */
export function extractSharedUrls(body: string): string[] {
  const urls: string[] = [];
  for (const match of body.matchAll(URL_PATTERN)) {
    const normalized = normalizeSharedUrl(match[0]);
    if (normalized) urls.push(normalized);
  }
  return urls;
}

/** `DOCUMENT` only for a known document extension at the end of the path. */
export function sharedLinkKind(
  url: string,
): ConversationSharedLink["kind"] {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return DOCUMENT_EXTENSIONS.some((extension) =>
      pathname.endsWith(extension),
    )
      ? "DOCUMENT"
      : "LINK";
  } catch {
    return "LINK";
  }
}

/**
 * Display text for a link: host + path, never the query or fragment, capped so
 * one long URL cannot blow up the panel layout.
 */
export function sharedLinkLabel(
  url: string,
): { host: string; label: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const path = parsed.pathname === "/" ? "" : parsed.pathname;
  const text = `${parsed.hostname}${path}`;
  return {
    host: parsed.hostname,
    label:
      text.length <= SHARED_LINK_LABEL_MAX
        ? text
        : `${text.slice(0, SHARED_LINK_LABEL_MAX - 1)}…`,
  };
}

/**
 * Newest-first rows become the deduped link list. The first (newest) mention
 * of a URL wins, which also decides `mine` and `createdAt`.
 */
export function buildSharedLinks(
  rows: SharedLinkSourceRow[],
  viewerId: string,
  limit = SHARED_LINK_LIMIT,
): ConversationSharedLink[] {
  const seen = new Set<string>();
  const links: ConversationSharedLink[] = [];

  for (const row of rows) {
    for (const url of extractSharedUrls(row.body)) {
      if (seen.has(url)) continue;
      seen.add(url);
      const display = sharedLinkLabel(url);
      if (!display) continue;
      links.push({
        url,
        host: display.host,
        label: display.label,
        kind: sharedLinkKind(url),
        createdAt: row.createdAt.toISOString(),
        mine: row.senderId === viewerId,
      });
      if (links.length >= limit) return links;
    }
  }
  return links;
}

/** Public profile block for the thread participant. */
export function toParticipantProfile(
  participant: ConversationUserRow,
): MessageParticipantProfile {
  return {
    bio: participant.bio,
    institution: participant.institution,
    country: participant.country,
    currentStatus: participant.currentStatus,
    companyName: participant.companyName,
    jobTitle: participant.jobTitle,
    // The column is a nullable array; the contract is always an array.
    skills: participant.skills ?? [],
    rating: participant.rating,
    role: participant.role,
    memberSince: participant.createdAt.toISOString(),
    website: participant.website,
    github: participant.github,
    linkedin: participant.linkedin,
  };
}

async function sharedMediaRows(
  conversationId: string,
): Promise<ConversationSharedMedia[]> {
  const rows = await getDb()
    .select({
      id: messageAttachments.id,
      mime: messageAttachments.mime,
      width: messageAttachments.width,
      height: messageAttachments.height,
      createdAt: messages.createdAt,
    })
    .from(messageAttachments)
    .innerJoin(messages, eq(messages.id, messageAttachments.messageId))
    .where(
      and(
        eq(messages.conversationId, conversationId),
        isNull(messages.deletedAt),
      ),
    )
    .orderBy(desc(messages.createdAt), desc(messageAttachments.id))
    .limit(SHARED_MEDIA_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    url: messageAttachmentUrl(row.id),
    mime: row.mime as MessageImageMime,
    width: row.width,
    height: row.height,
    createdAt: row.createdAt.toISOString(),
  }));
}

async function sharedLinkRows(
  conversationId: string,
): Promise<SharedLinkSourceRow[]> {
  return getDb()
    .select({
      body: messages.body,
      senderId: messages.senderId,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        isNull(messages.deletedAt),
        ilike(messages.body, "%http%"),
      ),
    )
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(SHARED_LINK_MESSAGE_WINDOW);
}

/**
 * Shared media and links for the info panel. Visibility mirrors the thread:
 * malformed ids, non-participants, a banned counterpart and either-side blocks
 * all behave like a missing conversation.
 */
export async function getConversationSharedContent(
  viewerId: string,
  conversationId: string,
): Promise<ConversationSharedContent | null> {
  if (!isUuid(conversationId)) return null;
  const conversation = await conversationForViewer(conversationId, viewerId);
  if (!conversation || !isParticipant(conversation, viewerId)) return null;

  const participant =
    conversation.userAId === viewerId ? conversation.userB : conversation.userA;
  if (participant.isBanned) return null;
  if (await isBlockedEitherWay(viewerId, participant.id)) return null;

  const [media, linkRows] = await Promise.all([
    sharedMediaRows(conversationId),
    sharedLinkRows(conversationId),
  ]);
  return { media, links: buildSharedLinks(linkRows, viewerId) };
}
