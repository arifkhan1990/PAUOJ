import { z } from "zod";

/**
 * Push endpoints are always https URLs issued by the browser's push service.
 * Browsers may hand back base64url keys, but a few implementations pad them
 * with "=" or keep "+/" from standard base64, so accept both alphabets.
 */
const ENDPOINT_MAX_LENGTH = 2048;

export const pushEndpointSchema = z
  .url({ protocol: /^https$/ })
  .max(ENDPOINT_MAX_LENGTH, "Push endpoints are at most 2048 characters.");

const subscriptionKeySchema = (min: number, max: number) =>
  z
    .string()
    .min(min)
    .max(max)
    .regex(
      /^[A-Za-z0-9_\-+/=]+$/,
      "Subscription keys must be base64 or base64url encoded.",
    );

export const pushSubscribeSchema = z.object({
  endpoint: pushEndpointSchema,
  keys: z.object({
    p256dh: subscriptionKeySchema(20, 200),
    auth: subscriptionKeySchema(8, 100),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: pushEndpointSchema,
});

export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;
export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;
