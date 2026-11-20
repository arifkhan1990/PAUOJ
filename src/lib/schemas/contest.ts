import { z } from "zod";

export const contestInputSchema = z
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
    startAt: z.iso.datetime({
      offset: true,
      message: "Choose a valid start time.",
    }),
    endAt: z.iso.datetime({
      offset: true,
      message: "Choose a valid end time.",
    }),
    isPublic: z.boolean().default(true),
    division: z.enum(["OPEN", "DIV1", "DIV2", "DIV3", "DIV4"]).default("OPEN"),
    freezeMinutes: z.coerce.number().int().min(0).max(720).default(0),
    problemIds: z
      .array(z.uuid())
      .min(1, "Select at least one problem.")
      .max(26, "A contest can have at most 26 problems."),
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

export type ContestInput = z.infer<typeof contestInputSchema>;
