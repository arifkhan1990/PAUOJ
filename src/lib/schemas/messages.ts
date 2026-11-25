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

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type OpenConversationInput = z.infer<typeof openConversationSchema>;
