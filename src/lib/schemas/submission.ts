import { z } from "zod";

export const languageSchema = z.enum([
  "c",
  "cpp",
  "python",
  "javascript",
  "java",
  "csharp",
  "go",
  "php",
  "kotlin",
  "swift",
]);

export const createSubmissionSchema = z.object({
  problemId: z.uuid("Invalid problem."),
  contestId: z.uuid().nullish(),
  assessmentId: z.uuid().nullish(),
  virtualContestId: z.uuid().nullish(),
  language: languageSchema,
  source: z
    .string()
    .min(1, "Write some code first.")
    .max(65536, "Source code must be at most 64 KB."),
});

export const runCodeSchema = z.object({
  problemId: z.uuid().nullish(),
  language: languageSchema,
  source: z
    .string()
    .min(1, "Write some code first.")
    .max(65536, "Source code must be at most 64 KB."),
  stdin: z.string().max(16384, "Input must be at most 16 KB.").default(""),
});

export const submissionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  mine: z.enum(["true", "false"]).optional(),
  status: z.string().max(32).optional(),
  language: languageSchema.optional(),
  problem: z.string().max(120).optional(),
  user: z.string().max(64).optional(),
  assessment: z.string().max(120).optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type RunCodeInput = z.infer<typeof runCodeSchema>;
