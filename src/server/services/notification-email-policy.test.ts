import { describe, expect, it } from "vitest";
import {
  emailCategoryForNotification,
  emailEnabled,
  type NotificationEmailSettings,
} from "./notification-email-policy";
import type { NotificationType } from "@/lib/notification-types";

const ALL_ON: NotificationEmailSettings = {
  emailVerdicts: true,
  emailContests: true,
  emailClarifications: true,
  emailReviews: true,
  emailAccount: true,
  emailLearning: true,
  emailAchievements: true,
  emailAnnouncements: true,
  emailMarketing: true,
  emailDiscussions: true,
  emailMessages: true,
  emailFollows: true,
};

const ALL_OFF: NotificationEmailSettings = Object.fromEntries(
  Object.keys(ALL_ON).map((key) => [key, false]),
) as NotificationEmailSettings;

describe("notification email categories", () => {
  it("maps every event to one preference category", () => {
    const cases: [NotificationType, string | null][] = [
      ["WELCOME", "account"],
      ["VERDICT", "verdicts"],
      ["CONTEST_START", "contests"],
      ["CONTEST_REGISTRATION", "contests"],
      ["CONTEST_REMINDER", "contests"],
      ["CONTEST_RESULT", "contests"],
      ["CLARIFICATION", "clarifications"],
      ["CONTRIBUTION", "reviews"],
      ["CONTEST_APPROVAL", "reviews"],
      ["LEARNING_ENROLLMENT", "learning"],
      ["LEARNING_PAYMENT", "learning"],
      ["LEARNING_REMINDER", "learning"],
      ["ACHIEVEMENT", "achievements"],
      ["MILESTONE", "achievements"],
      ["ANNOUNCEMENT", "announcements"],
      ["MARKETING", "marketing"],
      ["DISCUSSION", "discussions"],
      ["MESSAGE", "messages"],
      ["FOLLOW", "follows"],
      ["FOLLOW_REQUEST", "follows"],
      ["FOLLOW_ACCEPTED", "follows"],
      ["SYSTEM", null],
    ];
    for (const [type, category] of cases) {
      expect(emailCategoryForNotification(type), type).toBe(category);
    }
  });

  it("respects the category switch", () => {
    expect(emailEnabled("MILESTONE", ALL_ON)).toBe(true);
    expect(emailEnabled("MILESTONE", ALL_OFF)).toBe(false);
    expect(emailEnabled("LEARNING_REMINDER", ALL_OFF)).toBe(false);
    expect(emailEnabled("ANNOUNCEMENT", ALL_OFF)).toBe(false);
    expect(emailEnabled("WELCOME", ALL_OFF)).toBe(false);
    expect(emailEnabled("MESSAGE", ALL_OFF)).toBe(false);
    expect(emailEnabled("DISCUSSION", ALL_OFF)).toBe(false);
  });

  it("sends follow email only when the follows category is on", () => {
    expect(emailEnabled("FOLLOW", ALL_ON)).toBe(true);
    expect(emailEnabled("FOLLOW_REQUEST", ALL_OFF)).toBe(false);
    expect(emailEnabled("FOLLOW_ACCEPTED", ALL_ON)).toBe(true);
    expect(emailEnabled("SYSTEM", ALL_ON)).toBe(false);
  });
});
