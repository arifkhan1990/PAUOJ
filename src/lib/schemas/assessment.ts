import { z } from "zod";

export const assessmentInputSchema = z
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
    description: z
      .string()
      .trim()
      .min(10, "Description is too short.")
      .max(50_000),
    accessCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z0-9-]{6,20}$/,
        "Access code must be 6–20 letters, numbers or dashes.",
      )
      .optional()
      .or(z.literal("")),
    startAt: z.iso.datetime({
      offset: true,
      message: "Choose a valid start time.",
    }),
    endAt: z.iso.datetime({
      offset: true,
      message: "Choose a valid end time.",
    }),
    durationMinutes: z.coerce.number().int().min(0).max(1440).default(0),
    isPublished: z.boolean().default(false),
    problemIds: z
      .array(z.uuid())
      .min(1, "Select at least one problem.")
      .max(26, "An assessment can have at most 26 problems."),
  })
  .superRefine((value, context) => {
    if (new Set(value.problemIds).size !== value.problemIds.length) {
      context.addIssue({
        code: "custom",
        path: ["problemIds"],
        message: "A problem can only appear once.",
      });
    }
    if (new Date(value.endAt).getTime() <= new Date(value.startAt).getTime()) {
      context.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "End time must be after the start time.",
      });
    }
  });

export const joinAssessmentSchema = z.object({
  code: z.string().trim().min(1, "Enter the access code.").max(40),
});

export type AssessmentInput = z.infer<typeof assessmentInputSchema>;
export type JoinAssessmentInput = z.infer<typeof joinAssessmentSchema>;
