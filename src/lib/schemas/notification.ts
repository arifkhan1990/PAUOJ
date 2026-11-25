import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  emailVerdicts: z.boolean(),
  emailContests: z.boolean(),
  emailClarifications: z.boolean(),
  emailReviews: z.boolean(),
  emailAccount: z.boolean(),
  emailLearning: z.boolean(),
  emailAchievements: z.boolean(),
  emailAnnouncements: z.boolean(),
  emailMarketing: z.boolean(),
  emailDiscussions: z.boolean(),
  emailMessages: z.boolean(),
  notifyMessages: z.boolean(),
  notifyFollows: z.boolean(),
  notifyMarketing: z.boolean(),
  reviewEmailFrequency: z.enum(["INSTANT", "HOURLY", "DAILY"]),
});

export const unsubscribeSchema = z.object({
  token: z.string().trim().min(10).max(200),
  scope: z.enum([
    "all",
    "account",
    "verdicts",
    "contests",
    "clarifications",
    "reviews",
    "learning",
    "achievements",
    "announcements",
    "marketing",
    "discussions",
    "messages",
  ]),
});

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;
