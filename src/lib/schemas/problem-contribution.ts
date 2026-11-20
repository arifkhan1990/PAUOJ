import { z } from "zod";
import { testCaseInputSchema } from "./problem";

const noteField = z.string().trim().max(1_000).optional().or(z.literal(""));

export const statementContributionSchema = z.object({
  kind: z.literal("STATEMENT"),
  note: noteField,
  payload: z.object({
    statement: z
      .string()
      .trim()
      .min(20, "Statement is too short.")
      .max(100_000),
    inputFormat: z.string().max(20_000).optional().or(z.literal("")),
    outputFormat: z.string().max(20_000).optional().or(z.literal("")),
    constraints: z.string().max(20_000).optional().or(z.literal("")),
  }),
});

export const testsContributionSchema = z.object({
  kind: z.literal("TESTS"),
  note: noteField,
  payload: z
    .object({
      tests: z
        .array(testCaseInputSchema)
        .min(1, "Add at least one test case.")
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
    }),
});

export const editorialContributionSchema = z.object({
  kind: z.literal("EDITORIAL"),
  note: noteField,
  payload: z.object({
    editorial: z
      .string()
      .trim()
      .min(40, "Editorial is too short.")
      .max(50_000),
  }),
});

export const problemContributionInputSchema = z.discriminatedUnion("kind", [
  statementContributionSchema,
  testsContributionSchema,
  editorialContributionSchema,
]);

export const contributionDecisionSchema = z
  .object({
    action: z.enum(["approve", "reject", "withdraw"]),
    reviewNote: z.string().trim().max(1_000).optional().or(z.literal("")),
    rejudge: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (
      value.action === "reject" &&
      (!value.reviewNote || value.reviewNote.trim().length < 3)
    ) {
      context.addIssue({
        code: "custom",
        path: ["reviewNote"],
        message: "Explain why the proposal was rejected.",
      });
    }
  });

export type ProblemContributionInput = z.infer<
  typeof problemContributionInputSchema
>;
export type ContributionDecisionInput = z.infer<
  typeof contributionDecisionSchema
>;
