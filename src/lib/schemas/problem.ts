import { z } from "zod";

export const testCaseInputSchema = z.object({
  input: z.string().max(1_000_000, "Test input is too large."),
  expectedOutput: z.string().max(1_000_000, "Expected output is too large."),
  isSample: z.boolean().default(false),
});

export const problemInputSchema = z
  .object({
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
    statement: z
      .string()
      .trim()
      .min(20, "Statement is too short.")
      .max(100_000),
    inputFormat: z.string().max(20_000).optional().or(z.literal("")),
    outputFormat: z.string().max(20_000).optional().or(z.literal("")),
    constraints: z.string().max(20_000).optional().or(z.literal("")),
    editorial: z.string().max(50_000).optional().or(z.literal("")),
    category: z.string().trim().max(60).optional().or(z.literal("")),
    subcategory: z.string().trim().max(60).optional().or(z.literal("")),
    companies: z
      .array(z.string().trim().min(1).max(40))
      .max(10, "Use at most 10 companies.")
      .default([]),
    checkerType: z.enum(["EXACT", "TOKEN", "FLOAT", "CUSTOM"]).default("EXACT"),
    checkerSource: z.string().max(20_000).optional().or(z.literal("")),
    floatTolerance: z.coerce.number().min(1e-9).max(1).default(0.000001),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]),
    points: z.coerce.number().int().min(10).max(1000),
    timeLimitMs: z.coerce.number().int().min(100).max(10_000),
    memoryLimitMb: z.coerce.number().int().min(64).max(1024),
    isPublic: z.boolean().default(true),
    tags: z
      .array(z.string().trim().min(1).max(30))
      .max(10, "Use at most 10 tags.")
      .default([]),
    tests: z
      .array(testCaseInputSchema)
      .min(2, "Add at least one sample and one hidden test.")
      .max(100, "At most 100 tests are allowed."),
  })
  .superRefine((value, context) => {
    if (!value.tests.some((test) => test.isSample)) {
      context.addIssue({
        code: "custom",
        path: ["tests"],
        message: "Add at least one sample test.",
      });
    }
    if (!value.tests.some((test) => !test.isSample)) {
      context.addIssue({
        code: "custom",
        path: ["tests"],
        message: "Add at least one hidden test.",
      });
    }
    if (
      value.checkerType === "CUSTOM" &&
      (!value.checkerSource || value.checkerSource.trim().length < 10)
    ) {
      context.addIssue({
        code: "custom",
        path: ["checkerSource"],
        message: "Add a custom checker script.",
      });
    }
  });

export type ProblemInput = z.infer<typeof problemInputSchema>;
export type TestCaseInput = z.infer<typeof testCaseInputSchema>;
