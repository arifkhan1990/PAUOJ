export type NotificationType =
  | "VERDICT"
  | "CONTEST_START"
  | "CONTEST_REGISTRATION"
  | "CONTEST_REMINDER"
  | "CONTEST_RESULT"
  | "CLARIFICATION"
  | "CONTRIBUTION"
  | "CONTEST_APPROVAL"
  | "FOLLOW"
  | "FOLLOW_REQUEST"
  | "FOLLOW_ACCEPTED"
  | "MESSAGE"
  | "DISCUSSION"
  | "WELCOME"
  | "LEARNING_ENROLLMENT"
  | "LEARNING_PAYMENT"
  | "LEARNING_REMINDER"
  | "ACHIEVEMENT"
  | "MILESTONE"
  | "ANNOUNCEMENT"
  | "MARKETING"
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
  emailAccount: boolean;
  emailLearning: boolean;
  emailAchievements: boolean;
  emailAnnouncements: boolean;
  emailMarketing: boolean;
  emailDiscussions: boolean;
  emailMessages: boolean;
  emailFollows: boolean;
  notifyMessages: boolean;
  notifyFollows: boolean;
  notifyMarketing: boolean;
  reviewEmailFrequency: ReviewEmailFrequency;
};

export type NotificationEmailCategory =
  | "account"
  | "verdicts"
  | "contests"
  | "clarifications"
  | "reviews"
  | "learning"
  | "achievements"
  | "announcements"
  | "marketing"
  | "discussions"
  | "messages"
  | "follows";

export type UnsubscribeScope =
  | "all"
  | "account"
  | "verdicts"
  | "contests"
  | "clarifications"
  | "reviews"
  | "learning"
  | "achievements"
  | "announcements"
  | "marketing"
  | "discussions"
  | "messages"
  | "follows";
