import { eq, sql } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import type { Database } from "@/server/db";
import { messageAttachments, messages } from "@/server/db/schema";

/** Rolling 24h upload cap per sender. */
export const MESSAGE_IMAGE_DAILY_LIMIT = 50;
/** Total live shared-image bytes per sender: 250 MiB. */
export const MESSAGE_IMAGE_STORAGE_LIMIT_BYTES = 250 * 1024 * 1024;
export const MESSAGE_IMAGE_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ImageQuotaViolation = "DAILY" | "STORAGE" | null;

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

/**
 * Pure decision so the caps stay testable without a database. Both limits are
 * inclusive: the 50th image of the window and a total of exactly 250 MiB land
 * on the allowed side, the next byte does not.
 */
export function imageQuotaViolation(input: {
  dailyCount: number;
  storedBytes: number;
  incomingBytes: number;
}): ImageQuotaViolation {
  if (input.dailyCount >= MESSAGE_IMAGE_DAILY_LIMIT) return "DAILY";
  if (
    input.storedBytes + input.incomingBytes >
    MESSAGE_IMAGE_STORAGE_LIMIT_BYTES
  ) {
    return "STORAGE";
  }
  return null;
}

/**
 * Serialises image sends for one sender. Two concurrent sends can both observe
 * the same pre-send totals, so the quota is only trustworthy while this
 * transaction-scoped advisory lock is held. Released at transaction end.
 */
export function lockImageQuota(
  tx: Transaction,
  userId: string,
): Promise<unknown> {
  const key = `message-image-quota:${userId}`;
  return tx.execute(
    sql`select pg_advisory_xact_lock(hashtext(${key})::bigint)`,
  );
}

/**
 * Counts the sender's attachments from the last 24h and sums every live
 * attachment's bytes in one pass. Must be called after `lockImageQuota` and
 * before inserting the new message/attachment.
 */
export async function assertImageQuota(
  tx: Transaction,
  userId: string,
  incomingBytes: number,
): Promise<void> {
  // postgres.js does not infer a timestamptz parameter from a Date inside a
  // raw SQL template, so send an ISO string and cast it explicitly.
  const cutoff = new Date(
    Date.now() - MESSAGE_IMAGE_DAILY_WINDOW_MS,
  ).toISOString();
  const [row] = await tx
    .select({
      dailyCount: sql<number>`count(*) filter (where ${messageAttachments.createdAt} >= ${cutoff}::timestamptz)`,
      storedBytes: sql<number>`coalesce(sum(octet_length(${messageAttachments.bytes})), 0)`,
    })
    .from(messageAttachments)
    .innerJoin(messages, eq(messages.id, messageAttachments.messageId))
    .where(eq(messages.senderId, userId));

  const violation = imageQuotaViolation({
    dailyCount: Number(row?.dailyCount ?? 0),
    storedBytes: Number(row?.storedBytes ?? 0),
    incomingBytes,
  });
  if (violation === "DAILY") {
    throw errors.rateLimited(
      "You can share up to 50 images in 24 hours. Please try again later.",
    );
  }
  if (violation === "STORAGE") {
    throw errors.validation(
      "Your shared-image storage is full (250 MB). Delete some image messages to free space.",
    );
  }
}
