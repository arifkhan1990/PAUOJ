import type { PresenceInfo } from "./follow-types";
import type { UserCurrentStatus } from "./profile-fields";
import type { UserRole } from "./types";

export type MessageImageMime = "image/png" | "image/jpeg" | "image/webp";

/** Allow-listed document types; legacy Office binaries are intentionally out. */
export type MessageDocumentMime =
  | "application/pdf"
  | "text/plain"
  | "text/csv"
  | "application/zip"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export type MessageImageAttachment = {
  kind: "IMAGE";
  id: string;
  mime: MessageImageMime;
  width: number;
  height: number;
  /** Same-origin, participant-only URL that streams the image. */
  url: string;
};

export type MessageDocumentAttachment = {
  kind: "DOCUMENT";
  id: string;
  mime: MessageDocumentMime;
  fileName: string;
  sizeBytes: number;
  /** Same-origin, participant-only URL that downloads the document. */
  url: string;
};

/** At most one attachment per message: an image or a document. */
export type MessageAttachment =
  | MessageImageAttachment
  | MessageDocumentAttachment;

export type MessageItem = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
  readAt: string | null;
  deleted: boolean;
  attachment: MessageAttachment | null;
};

/**
 * Public profile details shown in the conversation info panel. Only fields
 * that already render on a public profile are included; private contact,
 * swag and account fields never cross this boundary.
 */
export type MessageParticipantProfile = {
  bio: string | null;
  institution: string | null;
  country: string | null;
  currentStatus: UserCurrentStatus | null;
  companyName: string | null;
  jobTitle: string | null;
  skills: string[];
  rating: number;
  role: UserRole;
  /** ISO timestamp. */
  memberSince: string;
  website: string | null;
  github: string | null;
  linkedin: string | null;
};

/** One uploaded document shared anywhere in the conversation, newest first. */
export type ConversationSharedDocument = {
  id: string;
  /** Same-origin, participant-only download URL. */
  url: string;
  fileName: string;
  mime: MessageDocumentMime;
  sizeBytes: number;
  createdAt: string;
  mine: boolean;
};

/**
 * An http(s) URL found in a message body. `DOCUMENT` links end in a common
 * document extension and back the info panel's Documents section.
 */
export type ConversationSharedLink = {
  url: string;
  host: string;
  /** Human readable host + path, already truncated for display. */
  label: string;
  kind: "LINK" | "DOCUMENT";
  createdAt: string;
  mine: boolean;
};

/** Lazy payload for the conversation info panel. */
export type ConversationSharedContent = {
  media: ConversationSharedMedia[];
  documents: ConversationSharedDocument[];
  links: ConversationSharedLink[];
};
export type ConversationSummary = {
  id: string;
  username: string;
  displayName: string;
  unreadCount: number;
  lastMessage: {
    body: string;
    mine: boolean;
    createdAt: string;
    deleted: boolean;
    hasAttachment: boolean;
    attachmentKind: "IMAGE" | "DOCUMENT" | null;
    attachmentName: string | null;
  } | null;
  lastMessageAt: string;
  presence: PresenceInfo;
  muted: boolean;
  avatarPreset: string | null;
  avatarImageUpdatedAt: string | null;
};

export type ConversationListPage = {
  items: ConversationSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  unreadTotal: number;
};

export type ConversationThread = {
  id: string;
  participant: {
    username: string;
    displayName: string;
    presence: PresenceInfo;
    avatarPreset: string | null;
    avatarImageUpdatedAt: string | null;
    profile: MessageParticipantProfile;
  };
  items: MessageItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** True when either side blocked the other, so sending is disabled. */
  blocked: boolean;
  muted: boolean;
};

/** One image shared anywhere in the conversation, newest first. */
export type ConversationSharedMedia = {
  id: string;
  /** Same-origin, participant-only attachment URL. */
  url: string;
  mime: MessageImageMime;
  width: number;
  height: number;
  createdAt: string;
};

export type MessageSuggestionKind = "contest" | "problem" | "learn";

/**
 * One row in the composer's entity drawer. `href` is always an internal path
 * and becomes the reference token when selected.
 */
export type MessageSuggestion = {
  kind: MessageSuggestionKind;
  id: string;
  label: string;
  meta: string | null;
  href: string;
};

export type MessageSuggestionResponse = {
  items: MessageSuggestion[];
};
