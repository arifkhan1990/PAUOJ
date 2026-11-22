import { z } from "zod";

export const reportCommentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Add a short reason (at least 5 characters).")
    .max(300, "Keep the reason under 300 characters."),
});

export type ReportCommentInput = z.infer<typeof reportCommentSchema>;

export const lessonReportQuerySchema = z.object({
  status: z.enum(["open", "resolved", "all"]).default("open"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export const resolveLessonReportSchema = z.object({
  status: z.literal("RESOLVED"),
});
