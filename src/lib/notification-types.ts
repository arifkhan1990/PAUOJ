export type NotificationType =
  | "VERDICT"
  | "CONTEST_START"
  | "CLARIFICATION"
  | "CONTRIBUTION"
  | "CONTEST_APPROVAL"
  | "FOLLOW"
  | "FOLLOW_REQUEST"
  | "FOLLOW_ACCEPTED"
  | "MESSAGE"
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
  notifyMessages: boolean;
  notifyFollows: boolean;
  reviewEmailFrequency: ReviewEmailFrequency;
};

export type UnsubscribeScope =
  | "all"
  | "verdicts"
  | "contests"
  | "clarifications"
  | "reviews";
