import { z } from "zod";

export const studyListLevelSchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
]);

export const studyListSectionInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Section title is too short.")
    .max(80, "Section title is too long."),
  description: z.string().trim().max(500).default(""),
  problemIds: z
    .array(z.uuid())
    .min(1, "Add at least one problem to every section.")
    .max(100, "Use at most 100 problems per section."),
});

export const studyListInputSchema = z
  .object({
    title: z.string().trim().min(3, "Title is too short.").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        /^[a-z0-9-]+$/,
        "Slug can use lowercase letters, numbers and dashes.",
      )
      .min(3)
      .max(80)
      .optional()
      .or(z.literal("")),
    description: z
      .string()
      .trim()
      .min(10, "Description is too short.")
      .max(5_000),
    level: studyListLevelSchema.default("BEGINNER"),
    estimatedMinutes: z
      .number()
      .int()
      .min(5, "Estimate at least 5 minutes or leave it blank.")
      .max(6_000)
      .nullable()
      .default(null),
    isFeatured: z.boolean().default(false),
    isPublic: z.boolean().default(true),
    sections: z
      .array(studyListSectionInputSchema)
      .min(1, "Add at least one section.")
      .max(20, "Use at most 20 sections."),
  })
  .superRefine((value, context) => {
    const problemIds = value.sections.flatMap((section) => section.problemIds);
    if (problemIds.length > 300) {
      context.addIssue({
        code: "custom",
        path: ["sections"],
        message: "Use at most 300 problems in one plan.",
      });
    }
    if (new Set(problemIds).size !== problemIds.length) {
      context.addIssue({
        code: "custom",
        path: ["sections"],
        message: "A problem can appear only once in a plan.",
      });
    }
    const titles = value.sections.map((section) => section.title.toLowerCase());
    if (new Set(titles).size !== titles.length) {
      context.addIssue({
        code: "custom",
        path: ["sections"],
        message: "Section titles must be unique inside a plan.",
      });
    }
  });

export type StudyListInput = z.infer<typeof studyListInputSchema>;
export type StudyListSectionInput = z.infer<typeof studyListSectionInputSchema>;
