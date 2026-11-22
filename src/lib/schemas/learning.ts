import { z } from "zod";

export const learningCheckpointStartSchema = z.object({
  moduleSlug: z.string().trim().min(1, "Module is required.").max(120),
});

export type LearningCheckpointStartInput = z.infer<
  typeof learningCheckpointStartSchema
>;
