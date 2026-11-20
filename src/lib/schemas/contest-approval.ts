import { z } from "zod";

export const contestApprovalDecisionSchema = z
  .object({
    action: z.enum(["approve", "reject"]),
    reviewNote: z.string().trim().max(1_000).optional().or(z.literal("")),
  })
  .superRefine((value, context) => {
    if (
      value.action === "reject" &&
      (!value.reviewNote || value.reviewNote.trim().length < 3)
    ) {
      context.addIssue({
        code: "custom",
        path: ["reviewNote"],
        message: "Explain why the problem cannot be used.",
      });
    }
  });

export type ContestApprovalDecisionInput = z.infer<
  typeof contestApprovalDecisionSchema
>;
