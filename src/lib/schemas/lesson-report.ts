import { z } from "zod";

export const reportCommentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Add a short reason (at least 5 characters).")
    .max(300, "Keep the reason under 300 characters."),
});

export type ReportCommentInput = z.infer<typeof reportCommentSchema>;
