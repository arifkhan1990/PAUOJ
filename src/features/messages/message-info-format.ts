import type {
  ConversationSharedLink,
  ConversationSharedMedia,
} from "@/lib/message-types";

export type SharedLinkSections = {
  documents: ConversationSharedLink[];
  links: ConversationSharedLink[];
};

/** Split the endpoint's flat link list into the panel's two sections. */
export function splitSharedLinks(
  links: readonly ConversationSharedLink[],
): SharedLinkSections {
  return {
    documents: links.filter((link) => link.kind === "DOCUMENT"),
    links: links.filter((link) => link.kind !== "DOCUMENT"),
  };
}

/**
 * One-line label for a shared link row. The server already truncates it, so
 * this only guards against empty payloads before falling back to the host.
 */
export function sharedLinkLabel(link: ConversationSharedLink): string {
  const label = link.label.trim();
  if (label) return label;
  const host = link.host.trim();
  if (host) return host;
  return link.url;
}

/** Newest-first media capped for the thumbnail grid (the endpoint caps too). */
export function sharedMediaThumbnails(
  media: readonly ConversationSharedMedia[],
  limit = 24,
): ConversationSharedMedia[] {
  return media.slice(0, Math.max(0, limit));
}
