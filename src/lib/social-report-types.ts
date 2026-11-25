export type SocialReportKind =
  | "MESSAGE"
  | "CONVERSATION"
  | "FOLLOW_REQUEST"
  | "PROFILE";

export type SocialReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE"
  | "SCAM"
  | "IMPERSONATION"
  | "OTHER";

export type SocialReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

export type SocialReportItem = {
  id: string;
  kind: SocialReportKind;
  reason: SocialReportReason;
  status: SocialReportStatus;
  details: string | null;
  excerpt: string | null;
  conversationId: string | null;
  messageId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  reporter: { username: string; displayName: string };
  target: { username: string; displayName: string };
};

export type SocialReportPage = {
  items: SocialReportItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
