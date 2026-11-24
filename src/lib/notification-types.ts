export type NotificationType =
  | "VERDICT"
  | "CONTEST_START"
  | "CLARIFICATION"
  | "CONTRIBUTION"
  | "CONTEST_APPROVAL"
  | "FOLLOW"
  | "SYSTEM";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ReviewEmailFrequency = "INSTANT" | "HOURLY" | "DAILY";

export type NotificationPreferences = {
  emailVerdicts: boolean;
  emailContests: boolean;
  emailClarifications: boolean;
  emailReviews: boolean;
  reviewEmailFrequency: ReviewEmailFrequency;
};

export type UnsubscribeScope =
  | "all"
  | "verdicts"
  | "contests"
  | "clarifications"
  | "reviews";
