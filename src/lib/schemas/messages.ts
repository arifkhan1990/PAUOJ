import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a message before sending it.")
    .max(2000, "Messages can be at most 2000 characters."),
});

export const openConversationSchema = z.object({
  username: z.string().trim().min(1).max(64),
});

/** Multipart caption for an image message; an empty caption is allowed. */
export const sendMessageImageSchema = z.object({
  caption: z
    .string()
    .max(2000, "Captions can be at most 2000 characters.")
    .optional(),
});

export const messageSuggestionKindSchema = z.enum([
  "contest",
  "problem",
  "learn",
]);

export const messageSuggestionQuerySchema = z.object({
  kind: messageSuggestionKindSchema,
  q: z.string().trim().max(80).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type OpenConversationInput = z.infer<typeof openConversationSchema>;
export type SendMessageImageInput = z.infer<typeof sendMessageImageSchema>;
export type MessageSuggestionQuery = z.infer<
  typeof messageSuggestionQuerySchema
>;
