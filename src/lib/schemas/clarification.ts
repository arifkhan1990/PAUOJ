import { z } from "zod";

export const clarificationQuestionSchema = z.object({
  problemId: z.uuid("Invalid problem.").nullish(),
  question: z
    .string()
    .trim()
    .min(5, "Write at least 5 characters.")
    .max(2_000, "Questions can be at most 2000 characters."),
});

export const clarificationAnswerSchema = z.object({
  answer: z
    .string()
    .trim()
    .min(2, "Write at least 2 characters.")
    .max(5_000, "Answers can be at most 5000 characters."),
});

export const clarificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export type ClarificationQuestionInput = z.infer<
  typeof clarificationQuestionSchema
>;
export type ClarificationAnswerInput = z.infer<
  typeof clarificationAnswerSchema
>;
