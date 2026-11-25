import { and, eq, lt, or, sql } from "drizzle-orm";
import { getDb, type Database } from "@/server/db";
import { emailOutbox } from "@/server/db/schema";
import { logger } from "@/server/logger";
import { deliverNotificationEmail } from "@/server/mail";

/** The fifth failed attempt is terminal; operators can inspect FAILED rows. */
export const EMAIL_OUTBOX_MAX_ATTEMPTS = 5;
export const EMAIL_OUTBOX_SENT_RETENTION_DAYS = 30;
export const EMAIL_OUTBOX_FAILED_RETENTION_DAYS = 90;

const SENDING_STALE_MS = 10 * 60_000;
const RETRY_DELAYS_MS = [2 * 60_000, 10 * 60_000, 60 * 60_000, 6 * 60 * 60_000];

/** Backoff for attempt n (1-based): 2m, 10m, 1h, then 6h. */
export function emailRetryDelayMs(attempts: number): number {
  const index = Math.max(
    0,
    Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1),
  );
  return RETRY_DELAYS_MS[index]!;
}

export type EnqueueEmailInput = {
  userId: string;
  toEmail: string;
  displayName: string;
  subject: string;
  body: string;
  href?: string | null;
  unsubscribeUrl: string;
  dedupeKey: string;
};

let flushInFlight: Promise<void> | null = null;
let flushDirty = false;

/**
 * Immediate-dispatch fast path. The row is already durable, so this only
 * reduces latency: the worker's 30-second sweep remains the safety net.
 * Enqueues during a pass set `flushDirty` and trigger another pass.
 */
export function requestEmailFlush(): void {
  if (flushInFlight) {
    flushDirty = true;
    return;
  }
  flushInFlight = (async () => {
    do {
      flushDirty = false;
      await processEmailOutbox();
    } while (flushDirty);
  })()
    .catch((error) => {
      logger.warn("Immediate email flush failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    })
    .finally(() => {
      flushInFlight = null;
      if (flushDirty) requestEmailFlush();
    });
}

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Executor = Database | Transaction;

/** Idempotent insert: the unique `dedupe_key` absorbs retries and races. */
export async function enqueueNotificationEmail(
  input: EnqueueEmailInput,
  executor: Executor = getDb(),
  options: { flush?: boolean } = {},
): Promise<boolean> {
  const [row] = await executor
    .insert(emailOutbox)
    .values({
      userId: input.userId,
      toEmail: input.toEmail,
      displayName: input.displayName,
      subject: input.subject,
      body: input.body,
      href: input.href ?? null,
      unsubscribeUrl: input.unsubscribeUrl,
      dedupeKey: input.dedupeKey,
    })
    .onConflictDoNothing()
    .returning({ id: emailOutbox.id });
  const created = Boolean(row);
  if (created && options.flush !== false) requestEmailFlush();
  return created;
}

type ClaimedEmail = {
  id: string;
  toEmail: string;
  displayName: string;
  subject: string;
  body: string;
  href: string | null;
  unsubscribeUrl: string;
  attempts: number;
};

/**
 * Atomically claims the oldest due row. `FOR UPDATE SKIP LOCKED` lets several
 * workers poll without sending the same email twice; a crashed sender is reset
 * to PENDING by the stale-SENDING sweep.
 */
async function claimNextEmail(now: Date): Promise<ClaimedEmail | null> {
  const [row] = await getDb()
    .update(emailOutbox)
    .set({ status: "SENDING", updatedAt: now })
    .where(
      sql`${emailOutbox.id} = (
        select ${emailOutbox.id} from ${emailOutbox}
        where ${emailOutbox.status} = 'PENDING'
          and ${emailOutbox.nextAttemptAt} <= ${now.toISOString()}::timestamptz
        order by ${emailOutbox.nextAttemptAt}
        limit 1
        for update skip locked
      )`,
    )
    .returning({
      id: emailOutbox.id,
      toEmail: emailOutbox.toEmail,
      displayName: emailOutbox.displayName,
      subject: emailOutbox.subject,
      body: emailOutbox.body,
      href: emailOutbox.href,
      unsubscribeUrl: emailOutbox.unsubscribeUrl,
      attempts: emailOutbox.attempts,
    });
  return row ?? null;
}

/** Worker sweep: sends due rows, retries failures with backoff, marks terminal failures. */
export async function processEmailOutbox(
  now: Date = new Date(),
  limit: number = 100,
): Promise<{ sent: number; retried: number; failed: number }> {
  const db = getDb();
  await db
    .update(emailOutbox)
    .set({ status: "PENDING", updatedAt: now })
    .where(
      and(
        eq(emailOutbox.status, "SENDING"),
        lt(emailOutbox.updatedAt, new Date(now.getTime() - SENDING_STALE_MS)),
      ),
    );

  let sent = 0;
  let retried = 0;
  let failed = 0;

  for (let index = 0; index < limit; index += 1) {
    const row = await claimNextEmail(now);
    if (!row) break;

    let delivered = false;
    let lastError = "SMTP delivery failed";
    try {
      delivered = await deliverNotificationEmail({
        to: row.toEmail,
        displayName: row.displayName,
        subject: row.subject,
        message: row.body,
        href: row.href,
        unsubscribeUrl: row.unsubscribeUrl,
      });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    if (delivered) {
      await db
        .update(emailOutbox)
        .set({
          status: "SENT",
          sentAt: now,
          lastError: null,
          updatedAt: now,
        })
        .where(eq(emailOutbox.id, row.id));
      sent += 1;
      continue;
    }

    const attempts = row.attempts + 1;
    if (attempts >= EMAIL_OUTBOX_MAX_ATTEMPTS) {
      await db
        .update(emailOutbox)
        .set({
          status: "FAILED",
          attempts,
          lastError: `${lastError} (${attempts} attempts)`.slice(0, 1000),
          updatedAt: now,
        })
        .where(eq(emailOutbox.id, row.id));
      failed += 1;
      continue;
    }

    await db
      .update(emailOutbox)
      .set({
        status: "PENDING",
        attempts,
        lastError: lastError.slice(0, 1000),
        nextAttemptAt: new Date(now.getTime() + emailRetryDelayMs(attempts)),
        updatedAt: now,
      })
      .where(eq(emailOutbox.id, row.id));
    retried += 1;
  }

  if (sent > 0 || retried > 0 || failed > 0) {
    logger.info("Notification email outbox processed", {
      sent,
      retried,
      failed,
    });
  }
  if (failed > 0) {
    logger.warn("Notification email outbox has terminal failures", { failed });
  }
  return { sent, retried, failed };
}

/** Removes delivered and long-terminal rows so the queue cannot grow forever. */
export async function pruneEmailOutbox(now: Date = new Date()): Promise<number> {
  const sentCutoff = new Date(
    now.getTime() - EMAIL_OUTBOX_SENT_RETENTION_DAYS * 24 * 60 * 60_000,
  );
  const failedCutoff = new Date(
    now.getTime() - EMAIL_OUTBOX_FAILED_RETENTION_DAYS * 24 * 60 * 60_000,
  );
  const rows = await getDb()
    .delete(emailOutbox)
    .where(
      or(
        and(eq(emailOutbox.status, "SENT"), lt(emailOutbox.sentAt, sentCutoff)),
        and(
          eq(emailOutbox.status, "FAILED"),
          lt(emailOutbox.updatedAt, failedCutoff),
        ),
      ),
    )
    .returning({ id: emailOutbox.id });
  return rows.length;
}
