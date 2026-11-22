import { z } from "zod";

export const lessonReactionSchema = z.object({
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export type LessonReactionInput = z.infer<typeof lessonReactionSchema>;
