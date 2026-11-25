import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(4).max(120),
  body: z.string().trim().min(10).max(2000),
  href: z
    .string()
    .trim()
    .max(300)
    .refine(
      (value) => value === "" || value.startsWith("/"),
      "Use an in-app path that starts with /.",
    )
    .optional(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
