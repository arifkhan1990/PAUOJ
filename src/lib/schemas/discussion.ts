import { z } from "zod";

export const commentBodySchema = z
  .string()
  .trim()
  .min(2, "Write at least 2 characters.")
  .max(2_000, "Comments can be at most 2000 characters.");

export const createCommentSchema = z.object({
  body: commentBodySchema,
  parentId: z.uuid("Invalid parent comment.").nullish(),
});

export const commentVoteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
});

export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  sort: z.enum(["top", "new"]).default("top"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CommentVoteInput = z.infer<typeof commentVoteSchema>;
export type CommentListQuery = z.infer<typeof commentListQuerySchema>;
