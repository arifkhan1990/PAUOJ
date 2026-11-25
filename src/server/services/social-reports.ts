import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { getDb, type Database } from "@/server/db";
import {
  auditLogs,
  messages,
  socialReports,
  userFollows,
  users,
} from "@/server/db/schema";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import type { CreateSocialReportInput } from "@/lib/schemas/social-report";
import type { SocialReportKind, SocialReportReason } from "@/lib/social-report-types";
import { logger } from "@/server/logger";
import {
  isParticipant,
  otherParticipantId,
  type ConversationPair,
} from "./message-helpers";
import { conversationForViewer } from "./message-queries";
import { notifyUser } from "./notifications";

export const SOCIAL_REPORT_RATE_LIMIT = 10;
export const SOCIAL_REPORT_RATE_WINDOW_SECONDS = 60 * 60;
export const SOCIAL_REPORT_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const SOCIAL_REPORT_EXCERPT_LENGTH = 300;
export const SOCIAL_REPORT_DELETED_EXCERPT = "Message deleted";

const MAX_RETENTION_DAYS = 36_500;
const DAY_MS = 24 * 60 * 60 * 1000;

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export type SocialReportReporter = {
  id: string;
  username: string;
  displayName: string;
};

export type SocialReportTarget = {
  id: string;
  username: string;
  displayName: string;
};

/** Keeps excerpts bounded so a report row never copies a whole thread. */
export function truncateSocialExcerpt(
  body: string,
  max = SOCIAL_REPORT_EXCERPT_LENGTH,
): string {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : normalized.slice(0, max);
}

/** Deleted messages keep their row, so the original body must never leak. */
export function buildMessageExcerpt(row: {
  body: string;
  deletedAt: Date | null;
}): string {
  return row.deletedAt
    ? SOCIAL_REPORT_DELETED_EXCERPT
    : truncateSocialExcerpt(row.body);
}

export function isDuplicateWithinWindow(
  createdAt: Date,
  now: Date,
  windowMs = SOCIAL_REPORT_DUPLICATE_WINDOW_MS,
): boolean {
  return createdAt.getTime() >= now.getTime() - windowMs;
}

export type SocialReportDuplicateScope = {
  reporterId: string;
  kind: SocialReportKind;
  targetUserId: string;
  messageId?: string | null;
  conversationId?: string | null;
};

/**
 * One advisory-lock key per reporter + report scope. A message report is keyed
 * by the message, a conversation report by the conversation, and profile or
 * follow-request reports by the target user.
 */
export function socialReportDuplicateLockKey(
  scope: SocialReportDuplicateScope,
): string {
  const target =
    scope.messageId ?? scope.conversationId ?? scope.targetUserId;
  return [
    "social-report",
    scope.reporterId,
    scope.kind,
    scope.targetUserId,
    target,
  ].join(":");
}

/**
 * A message report is valid only when the reporter is in the conversation and
 * the reported username is the counterpart, never a third party or themselves.
 */
export function isTargetAuthoredMessage(
  senderId: string,
  targetId: string,
): boolean {
  return senderId === targetId;
}

export function canReportMessage(
  conversation: ConversationPair,
  reporterId: string,
  targetUserId: string,
): boolean {
  if (!isParticipant(conversation, reporterId)) return false;
  return otherParticipantId(conversation, reporterId) === targetUserId;
}

/** Retention cutoffs are day-based instants measured back from `now`. */
export function retentionCutoff(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS);
}

/** Invalid or missing env values fall back to the documented default. */
export function parseRetentionDays(
  raw: string | undefined,
  fallback: number,
): number {
  if (raw === undefined) return fallback;
  const parsed = Number(raw.trim());
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_RETENTION_DAYS);
}

async function findReportTarget(username: string): Promise<SocialReportTarget> {
  const [target] = await getDb()
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      isBanned: users.isBanned,
    })
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);
  if (!target || target.isBanned) throw errors.notFound("User not found.");
  return {
    id: target.id,
    username: target.username,
    displayName: target.displayName,
  };
}

type ReportContext = {
  target: SocialReportTarget;
  conversationId: string | null;
  messageId: string | null;
  excerpt: string | null;
};

async function resolveMessageContext(
  reporterId: string,
  target: SocialReportTarget,
  messageId: string,
  suppliedConversationId: string | undefined,
): Promise<ReportContext> {
  const [message] = await getDb()
    .select({
      id: messages.id,
      body: messages.body,
      senderId: messages.senderId,
      deletedAt: messages.deletedAt,
      conversationId: messages.conversationId,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);
  if (!message) throw errors.notFound("Message not found.");

  const conversation = await conversationForViewer(
    message.conversationId,
    reporterId,
  );
  if (!conversation) throw errors.notFound("Message not found.");
  if (suppliedConversationId && suppliedConversationId !== message.conversationId) {
    throw errors.validation("This message belongs to another conversation.");
  }
  if (!canReportMessage(conversation, reporterId, target.id)) {
    throw errors.validation("The reported user is not part of this conversation.");
  }
  if (!isTargetAuthoredMessage(message.senderId, target.id)) {
    throw errors.validation("You can only report a message the other person sent.");
  }

  return {
    target,
    conversationId: message.conversationId,
    messageId: message.id,
    excerpt: buildMessageExcerpt(message),
  };
}

async function newestVisibleExcerpt(
  conversationId: string,
  senderId: string,
): Promise<string | null> {
  const [newest] = await getDb()
    .select({ body: messages.body })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.senderId, senderId),
        isNull(messages.deletedAt),
      ),
    )
    .orderBy(desc(messages.createdAt), desc(messages.id))
    .limit(1);
  return newest ? truncateSocialExcerpt(newest.body) : null;
}

async function resolveConversationContext(
  reporterId: string,
  target: SocialReportTarget,
  conversationId: string,
): Promise<ReportContext> {
  const conversation = await conversationForViewer(conversationId, reporterId);
  if (!conversation) throw errors.notFound("Conversation not found.");
  if (!canReportMessage(conversation, reporterId, target.id)) {
    throw errors.validation("The reported user is not part of this conversation.");
  }

  return {
    target,
    conversationId,
    messageId: null,
    excerpt: await newestVisibleExcerpt(conversationId, target.id),
  };
}

async function hasPendingFollowEdge(
  reporterId: string,
  targetId: string,
): Promise<boolean> {
  // Only the recipient can report the request; the follower cannot report
  // the person they asked to follow.
  const [edge] = await getDb()
    .select({ followerId: userFollows.followerId })
    .from(userFollows)
    .where(
      and(
        eq(userFollows.status, "PENDING"),
        eq(userFollows.followerId, targetId),
        eq(userFollows.followingId, reporterId),
      ),
    )
    .limit(1);
  return Boolean(edge);
}

async function resolveReportContext(
  reporterId: string,
  input: CreateSocialReportInput,
  target: SocialReportTarget,
): Promise<ReportContext> {
  switch (input.kind) {
    case "MESSAGE":
      // The schema guarantees messageId for this kind.
      return resolveMessageContext(
        reporterId,
        target,
        input.messageId as string,
        input.conversationId,
      );
    case "CONVERSATION":
      return resolveConversationContext(
        reporterId,
        target,
        input.conversationId as string,
      );
    case "FOLLOW_REQUEST":
      if (!(await hasPendingFollowEdge(reporterId, target.id))) {
        throw errors.validation(
          "There is no pending follow request with this user.",
        );
      }
      return { target, conversationId: null, messageId: null, excerpt: null };
    case "PROFILE":
      return { target, conversationId: null, messageId: null, excerpt: null };
  }
}

async function isDuplicateReport(
  tx: Transaction,
  reporterId: string,
  input: CreateSocialReportInput,
  context: ReportContext,
  now: Date,
): Promise<boolean> {
  const since = new Date(now.getTime() - SOCIAL_REPORT_DUPLICATE_WINDOW_MS);
  const [existing] = await tx
    .select({ createdAt: socialReports.createdAt })
    .from(socialReports)
    .where(
      and(
        eq(socialReports.reporterId, reporterId),
        eq(socialReports.kind, input.kind),
        eq(socialReports.targetUserId, context.target.id),
        gte(socialReports.createdAt, since),
        context.messageId
          ? eq(socialReports.messageId, context.messageId)
          : isNull(socialReports.messageId),
        context.conversationId
          ? eq(socialReports.conversationId, context.conversationId)
          : isNull(socialReports.conversationId),
      ),
    )
    .limit(1);
  return Boolean(existing && isDuplicateWithinWindow(existing.createdAt, now));
}

/**
 * Admins are notified after the report is stored. A notification failure never
 * turns a successfully stored report into an error for the reporter.
 */
async function notifyAdminsOfReport(
  reportId: string,
  kind: SocialReportKind,
  reason: SocialReportReason,
): Promise<void> {
  try {
    const admins = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "ADMIN"), eq(users.isBanned, false)));
    const results = await Promise.allSettled(
      admins.map((admin) =>
        notifyUser({
          userId: admin.id,
          type: "SYSTEM",
          title: "Social report needs review",
          body: `${kind} report filed: ${reason}.`,
          href: "/admin/social-reports",
          dedupeKey: `social-report:${reportId}`,
          email: false,
        }),
      ),
    );
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      logger.warn("Social report admin notification failed", {
        reportId,
        failed: failed.length,
      });
    }
  } catch (error) {
    logger.warn("Social report admin notification failed", {
      reportId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function createSocialReport(
  reporter: SocialReportReporter,
  input: CreateSocialReportInput,
): Promise<{ reported: true; id: string }> {
  await enforceRateLimit(
    `social-report:${reporter.id}`,
    SOCIAL_REPORT_RATE_LIMIT,
    SOCIAL_REPORT_RATE_WINDOW_SECONDS,
    "You are sending reports too quickly. Please try again later.",
  );

  const target = await findReportTarget(input.username);
  if (target.id === reporter.id) {
    throw errors.validation("You cannot report yourself.");
  }

  const context = await resolveReportContext(reporter.id, input, target);
  const now = new Date();

  const trimmedDetails = input.details?.trim();
  const details =
    trimmedDetails && trimmedDetails.length > 0 ? trimmedDetails : null;
  const db = getDb();
  const report = await db.transaction(async (tx) => {
    // Serialise identical reports from the same reporter so concurrent retries
    // cannot both pass the duplicate check. The lock is released on commit.
    const lockKey = socialReportDuplicateLockKey({
      reporterId: reporter.id,
      kind: input.kind,
      targetUserId: context.target.id,
      messageId: context.messageId,
      conversationId: context.conversationId,
    });
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`,
    );
    if (await isDuplicateReport(tx, reporter.id, input, context, now)) {
      throw errors.conflict(
        "You already reported this within the last 24 hours.",
      );
    }
    const [inserted] = await tx
      .insert(socialReports)
      .values({
        reporterId: reporter.id,
        targetUserId: context.target.id,
        kind: input.kind,
        reason: input.reason,
        details,
        excerpt: context.excerpt,
        conversationId: context.conversationId,
        messageId: context.messageId,
      })
      .returning({ id: socialReports.id });
    if (!inserted) {
      throw errors.unavailable("Could not file the report. Please retry.");
    }
    await tx.insert(auditLogs).values({
      actorId: reporter.id,
      action: "social.report",
      entityType: "social_report",
      entityId: inserted.id,
      metadata: {
        kind: input.kind,
        reason: input.reason,
        targetUserId: context.target.id,
      },
    });
    return inserted;
  });

  await notifyAdminsOfReport(report.id, input.kind, input.reason);
  return { reported: true, id: report.id };
}
