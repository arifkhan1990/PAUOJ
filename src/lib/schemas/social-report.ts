import { z } from "zod";

export const SOCIAL_REPORT_KINDS = [
  "MESSAGE",
  "CONVERSATION",
  "FOLLOW_REQUEST",
  "PROFILE",
] as const;

export const SOCIAL_REPORT_REASONS = [
  "SPAM",
  "HARASSMENT",
  "HATE",
  "SCAM",
  "IMPERSONATION",
  "OTHER",
] as const;

export const socialReportKindSchema = z.enum(SOCIAL_REPORT_KINDS);
export const socialReportReasonSchema = z.enum(SOCIAL_REPORT_REASONS);

/** Empty text means "no details"; the column stays null instead of "". */
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value.length > 0 ? value : undefined))
    .optional();

export const createSocialReportSchema = z
  .object({
    kind: socialReportKindSchema,
    username: z
      .string()
      .trim()
      .min(1, "Choose a user to report.")
      .max(64, "Usernames are at most 64 characters."),
    reason: socialReportReasonSchema,
    conversationId: z.uuid("Invalid conversation.").optional(),
    messageId: z.uuid("Invalid message.").optional(),
    details: optionalText(500, "Keep details under 500 characters."),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "MESSAGE" && !value.messageId) {
      ctx.addIssue({
        code: "custom",
        message: "Choose the message to report.",
        path: ["messageId"],
      });
    }
    if (value.kind === "CONVERSATION" && !value.conversationId) {
      ctx.addIssue({
        code: "custom",
        message: "Choose the conversation to report.",
        path: ["conversationId"],
      });
    }
    if (
      (value.kind === "FOLLOW_REQUEST" || value.kind === "PROFILE") &&
      (value.messageId || value.conversationId)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "This report type does not take message or conversation ids.",
        path: ["kind"],
      });
    }
  });

export type CreateSocialReportInput = z.infer<typeof createSocialReportSchema>;

export const socialReportListQuerySchema = z.object({
  status: z.enum(["open", "resolved", "dismissed", "all"]).default("open"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export type SocialReportListQuery = z.infer<typeof socialReportListQuerySchema>;

export const socialReportResolutionSchema = z.object({
  status: z.enum(["RESOLVED", "DISMISSED"]),
  note: optionalText(500, "Keep the note under 500 characters."),
});

export type SocialReportResolutionInput = z.infer<
  typeof socialReportResolutionSchema
>;
