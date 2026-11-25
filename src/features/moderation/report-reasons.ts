export const REPORT_DETAILS_MAX = 500;

export const REPORT_REASONS = [
  { value: "SPAM", label: "Spam or advertising" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "HATE", label: "Hate speech" },
  { value: "SCAM", label: "Scam or fraud" },
  { value: "IMPERSONATION", label: "Impersonation" },
  { value: "OTHER", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

export type ReportKind =
  | "MESSAGE"
  | "CONVERSATION"
  | "FOLLOW_REQUEST"
  | "PROFILE";

export type ReportPayload = {
  kind: ReportKind;
  username: string;
  reason: ReportReason;
  conversationId?: string;
  messageId?: string;
  details?: string;
};

export type ReportInput = {
  kind: ReportKind;
  username: string;
  reason: ReportReason;
  conversationId?: string | null;
  messageId?: string | null;
  details?: string | null;
};

export function reportReasonLabel(reason: ReportReason): string {
  return (
    REPORT_REASONS.find((option) => option.value === reason)?.label ?? "Other"
  );
}

/**
 * Builds the exact POST body for /api/v1/social-reports: empty details and
 * absent ids are omitted instead of sent as nulls.
 */
export function buildReportPayload(input: ReportInput): ReportPayload {
  const payload: ReportPayload = {
    kind: input.kind,
    username: input.username,
    reason: input.reason,
  };
  if (input.conversationId) payload.conversationId = input.conversationId;
  if (input.messageId) payload.messageId = input.messageId;
  const details = input.details?.trim();
  if (details) payload.details = details.slice(0, REPORT_DETAILS_MAX);
  return payload;
}
