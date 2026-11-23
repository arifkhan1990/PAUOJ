import { z } from "zod";

export const paidProductSchema = z.enum(["MODULE", "BUNDLE"]);

export const purchaseOrderSchema = z.object({
  product: paidProductSchema,
  moduleSlug: z.string().trim().max(80).nullish(),
  trxId: z.string().trim().min(6).max(40),
  senderNumber: z.string().trim().min(8).max(20),
});

export const freeAccessRequestSchema = z.object({
  product: paidProductSchema,
  moduleSlug: z.string().trim().max(80).nullish(),
  reason: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(500, "Keep the request under 500 characters."),
});

export const paymentReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REVOKE"]),
  note: z.string().trim().max(300).optional(),
});

export const grantEntitlementSchema = z.object({
  username: z.string().trim().min(3).max(40),
  product: paidProductSchema,
  moduleSlug: z.string().trim().max(80).nullish(),
});

export const paymentQueueQuerySchema = z.object({
  status: z.enum(["pending", "all"]).default("pending"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
export type FreeAccessRequestInput = z.infer<typeof freeAccessRequestSchema>;
export type PaymentReviewInput = z.infer<typeof paymentReviewSchema>;
export type GrantEntitlementInput = z.infer<typeof grantEntitlementSchema>;
