import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  emailVerdicts: z.boolean(),
  emailContests: z.boolean(),
  emailClarifications: z.boolean(),
  emailReviews: z.boolean(),
  reviewEmailFrequency: z.enum(["INSTANT", "HOURLY", "DAILY"]),
});

export const unsubscribeSchema = z.object({
  token: z.string().trim().min(10).max(200),
  scope: z.enum(["all", "verdicts", "contests", "clarifications", "reviews"]),
});

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;
