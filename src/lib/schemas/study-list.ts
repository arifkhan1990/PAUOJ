import { z } from "zod";

export const studyListInputSchema = z.object({
  title: z.string().trim().min(3, "Title is too short.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug can use lowercase letters, numbers and dashes.")
    .min(3)
    .max(80)
    .optional()
    .or(z.literal("")),
  description: z.string().trim().min(10, "Description is too short.").max(5_000),
  isPublic: z.boolean().default(true),
  problemIds: z
    .array(z.uuid())
    .min(1, "Add at least one problem.")
    .max(50, "Use at most 50 problems."),
});

export type StudyListInput = z.infer<typeof studyListInputSchema>;
