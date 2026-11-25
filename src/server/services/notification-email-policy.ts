import type {
  NotificationEmailCategory,
  NotificationType,
} from "@/lib/notification-types";

/**
 * One source of truth for type -> preference category. In-app notifications
 * and emails therefore cannot drift apart, and the settings page can describe
 * each category with the same names used by delivery.
 */
export function emailCategoryForNotification(
  type: NotificationType,
): NotificationEmailCategory | null {
  switch (type) {
    case "WELCOME":
      return "account";
    case "VERDICT":
      return "verdicts";
    case "CONTEST_START":
    case "CONTEST_REGISTRATION":
    case "CONTEST_REMINDER":
    case "CONTEST_RESULT":
      return "contests";
    case "CLARIFICATION":
      return "clarifications";
    case "CONTRIBUTION":
    case "CONTEST_APPROVAL":
      return "reviews";
    case "LEARNING_ENROLLMENT":
    case "LEARNING_PAYMENT":
    case "LEARNING_REMINDER":
      return "learning";
    case "ACHIEVEMENT":
    case "MILESTONE":
      return "achievements";
    case "ANNOUNCEMENT":
      return "announcements";
    case "MARKETING":
      return "marketing";
    case "DISCUSSION":
      return "discussions";
    case "MESSAGE":
      return "messages";
    case "FOLLOW":
    case "FOLLOW_REQUEST":
    case "FOLLOW_ACCEPTED":
      return "social";
    case "SYSTEM":
      return null;
  }
}

export type NotificationEmailSettings = {
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
};

export function emailEnabled(
  type: NotificationType,
  user: NotificationEmailSettings,
): boolean {
  const category = emailCategoryForNotification(type);
  if (!category) return false;
  switch (category) {
    case "account":
      return user.emailAccount;
    case "verdicts":
      return user.emailVerdicts;
    case "contests":
      return user.emailContests;
    case "clarifications":
      return user.emailClarifications;
    case "reviews":
      return user.emailReviews;
    case "learning":
      return user.emailLearning;
    case "achievements":
      return user.emailAchievements;
    case "announcements":
      return user.emailAnnouncements;
    case "marketing":
      return user.emailMarketing;
    case "discussions":
      return user.emailDiscussions;
    case "messages":
      return user.emailMessages;
    case "social":
      // Follow notices stay in-app only.
      return false;
  }
}
