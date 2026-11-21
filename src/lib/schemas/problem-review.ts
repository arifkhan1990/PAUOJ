import { z } from "zod";
import { languageSchema } from "./submission";

const REVIEW_TEST_FIELD_MAX = 256_000;
const REVIEW_TEST_TOTAL_MAX = 1_000_000;

const reviewTestCaseSchema = z.object({
  input: z.string().max(REVIEW_TEST_FIELD_MAX, "Test input is too large."),
  expectedOutput: z
    .string()
    .max(REVIEW_TEST_FIELD_MAX, "Expected output is too large."),
  isSample: z.boolean().default(false),
});

const optionalNote = z
  .string()
  .trim()
  .max(2_000)
  .optional()
  .or(z.literal(""));

const requiredComment = z
  .string()
  .trim()
  .min(10, "Write at least 10 characters so the author knows what to fix.")
  .max(2_000);

export const problemReviewActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("submit") }),
  z.object({
    action: z.literal("approve"),
    note: optionalNote,
    solutionLanguage: languageSchema,
    solutionSource: z
      .string()
      .trim()
      .min(1, "Add the reference solution you used to verify the problem.")
      .max(65_536),
    editorial: z
      .string()
      .trim()
      .min(40, "An editorial needs at least 40 characters.")
      .max(50_000)
      .optional()
      .or(z.literal("")),
    tests: z
      .array(reviewTestCaseSchema)
      .max(20)
      .default([])
      .refine(
        (tests) =>
          tests.every(
            (test) =>
              test.input.trim().length > 0 ||
              test.expectedOutput.trim().length > 0,
          ),
        "Remove empty test cases before approving.",
      )
      .refine(
        (tests) =>
          tests.reduce(
            (total, test) =>
              total + test.input.length + test.expectedOutput.length,
            0,
          ) <= REVIEW_TEST_TOTAL_MAX,
        "The review test payload is too large.",
      ),
  }),
  z.object({ action: z.literal("hold"), note: requiredComment }),
  z.object({
    action: z.literal("respond"),
    holdId: z.uuid("Invalid hold."),
    response: requiredComment,
  }),
  z.object({
    action: z.literal("resolve"),
    holdId: z.uuid("Invalid hold."),
    note: optionalNote,
  }),
  z.object({
    action: z.literal("reopen"),
    holdId: z.uuid("Invalid hold."),
    note: requiredComment,
  }),
  z.object({ action: z.literal("publish") }),
  z.object({
    action: z.literal("reopen_publication"),
    note: requiredComment,
  }),
]);

export type ProblemReviewActionInput = z.infer<
  typeof problemReviewActionSchema
>;

export type ProblemReviewApproveInput = Extract<
  ProblemReviewActionInput,
  { action: "approve" }
>;

export type ProblemReviewHoldInput = Extract<
  ProblemReviewActionInput,
  { action: "hold" }
>;

export type ProblemReviewRespondInput = Extract<
  ProblemReviewActionInput,
  { action: "respond" }
>;

export type ProblemReviewResolveInput = Extract<
  ProblemReviewActionInput,
  { action: "resolve" }
>;

export type ProblemReviewReopenInput = Extract<
  ProblemReviewActionInput,
  { action: "reopen" }
>;

export type ProblemReviewRereviewInput = Extract<
  ProblemReviewActionInput,
  { action: "reopen_publication" }
>;
