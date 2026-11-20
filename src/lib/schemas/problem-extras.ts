import { z } from "zod";

export const problemRatingSchema = z.object({
  rating: z
    .number()
    .min(0.5, "Choose at least half a star.")
    .max(5, "Choose at most five stars.")
    .multipleOf(0.5, "Ratings use half-star steps."),
});

export const problemResourceSchema = z.object({
  title: z.string().trim().min(3, "Title is too short.").max(120),
  url: z
    .url("Enter a valid URL.")
    .max(500)
    .refine((value) => /^https?:\/\//i.test(value), "Use an http(s) link."),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ProblemRatingInput = z.infer<typeof problemRatingSchema>;
export type ProblemResourceInput = z.infer<typeof problemResourceSchema>;
