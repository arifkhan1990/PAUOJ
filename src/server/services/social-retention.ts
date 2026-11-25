import { and, count, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  conversations,
  messages,
  socialReports,
  users,
} from "@/server/db/schema";
import { parseRetentionDays, retentionCutoff } from "./social-reports";

export const DEFAULT_MESSAGE_RETENTION_DAYS = 365;
export const DEFAULT_REPORT_RETENTION_DAYS = 730;
export const DEFAULT_PRESENCE_RETENTION_DAYS = 365;

export type SocialRetentionOptions = {
  apply: boolean;
  now?: Date;
  messageDays?: number;
  reportDays?: number;
  presenceDays?: number;
};

export type SocialRetentionCounts = {
  /** Old messages (apply) or messages older than the cutoff (dry run). */
  messages: number;
  /** Empty conversations deleted (apply) or eligible ones (dry run). */
  conversations: number;
  /** Closed reports deleted (apply) or eligible ones (dry run). */
  reports: number;
  /** Stale presence cleared (apply) or stale profiles (dry run). */
  presence: number;
};

async function countOldMessages(cutoff: Date): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(messages)
    .where(lt(messages.createdAt, cutoff));
  return Number(row?.value ?? 0);
}

async function countEmptyConversations(cutoff: Date): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(conversations)
    .where(
      and(
        lt(conversations.createdAt, cutoff),
        sql`not exists (
          select 1 from ${messages}
          where ${messages.conversationId} = ${conversations.id}
        )`,
      ),
    );
  return Number(row?.value ?? 0);
}

async function countClosedReports(cutoff: Date): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(socialReports)
    .where(
      and(
        inArray(socialReports.status, ["RESOLVED", "DISMISSED"]),
        lt(socialReports.createdAt, cutoff),
      ),
    );
  return Number(row?.value ?? 0);
}

async function countStaleUsers(cutoff: Date): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(users)
    .where(and(isNotNull(users.lastActiveAt), lt(users.lastActiveAt, cutoff)));
  return Number(row?.value ?? 0);
}

/** One statement inside one transaction, so a partial purge cannot happen. */
async function deleteOldMessages(cutoff: Date): Promise<number> {
  return getDb().transaction(async (tx) => {
    const rows = await tx.execute(sql`
      with deleted as (
        delete from ${messages}
        where ${messages.createdAt} < ${cutoff.toISOString()}::timestamptz
        returning 1
      )
      select count(*)::int as count from deleted
    `);
    return Number(rows[0]?.count ?? 0);
  });
}

async function deleteEmptyConversations(cutoff: Date): Promise<number> {
  return getDb().transaction(async (tx) => {
    const rows = await tx.execute(sql`
      with deleted as (
        delete from ${conversations}
        where ${conversations.createdAt} < ${cutoff.toISOString()}::timestamptz
          and not exists (
            select 1 from ${messages}
            where ${messages.conversationId} = ${conversations.id}
          )
        returning 1
      )
      select count(*)::int as count from deleted
    `);
    return Number(rows[0]?.count ?? 0);
  });
}

async function deleteClosedReports(cutoff: Date): Promise<number> {
  return getDb().transaction(async (tx) => {
    const rows = await tx.execute(sql`
      with deleted as (
        delete from ${socialReports}
        where ${socialReports.status} in ('RESOLVED', 'DISMISSED')
          and ${socialReports.createdAt} < ${cutoff.toISOString()}::timestamptz
        returning 1
      )
      select count(*)::int as count from deleted
    `);
    return Number(rows[0]?.count ?? 0);
  });
}

async function clearStalePresence(cutoff: Date): Promise<number> {
  return getDb().transaction(async (tx) => {
    const rows = await tx.execute(sql`
      with updated as (
        update ${users}
        set last_active_at = null, updated_at = now()
        where ${users.lastActiveAt} is not null
          and ${users.lastActiveAt} < ${cutoff.toISOString()}::timestamptz
        returning 1
      )
      select count(*)::int as count from updated
    `);
    return Number(rows[0]?.count ?? 0);
  });
}

/**
 * Deletes social rows past their retention cutoff, or just counts them when
 * `apply` is false. A dry run never writes; an apply run deletes messages
 * before conversations so newly emptied threads are removed in the same pass.
 */
export async function runSocialRetention(
  options: SocialRetentionOptions,
): Promise<SocialRetentionCounts> {
  const now = options.now ?? new Date();
  const messageDays =
    options.messageDays ??
    parseRetentionDays(
      process.env.SOCIAL_MESSAGE_RETENTION_DAYS,
      DEFAULT_MESSAGE_RETENTION_DAYS,
    );
  const reportDays =
    options.reportDays ??
    parseRetentionDays(
      process.env.SOCIAL_REPORT_RETENTION_DAYS,
      DEFAULT_REPORT_RETENTION_DAYS,
    );
  const presenceDays =
    options.presenceDays ??
    parseRetentionDays(
      process.env.SOCIAL_PRESENCE_RETENTION_DAYS,
      DEFAULT_PRESENCE_RETENTION_DAYS,
    );

  const messageCutoff = retentionCutoff(now, messageDays);
  const reportCutoff = retentionCutoff(now, reportDays);
  const presenceCutoff = retentionCutoff(now, presenceDays);

  if (!options.apply) {
    const [oldMessages, emptyConversations, closedReports, staleUsers] =
      await Promise.all([
        countOldMessages(messageCutoff),
        countEmptyConversations(messageCutoff),
        countClosedReports(reportCutoff),
        countStaleUsers(presenceCutoff),
      ]);
    return {
      messages: oldMessages,
      conversations: emptyConversations,
      reports: closedReports,
      presence: staleUsers,
    };
  }

  const deletedMessages = await deleteOldMessages(messageCutoff);
  const deletedConversations = await deleteEmptyConversations(messageCutoff);
  const deletedReports = await deleteClosedReports(reportCutoff);
  const clearedUsers = await clearStalePresence(presenceCutoff);

  return {
    messages: deletedMessages,
    conversations: deletedConversations,
    reports: deletedReports,
    presence: clearedUsers,
  };
}
