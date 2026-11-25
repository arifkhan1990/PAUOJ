import { sendNotification, setVapidDetails } from "web-push";
import { and, eq } from "drizzle-orm";
import type { NotificationType } from "@/lib/notification-types";
import type { PushSubscribeInput } from "@/lib/schemas/push";
import { getDb } from "@/server/db";
import { pushSubscriptions } from "@/server/db/schema";
import { logger } from "@/server/logger";

/** Push delivery is opt-out per event class through this allow-list. */
export const PUSH_TYPES: readonly NotificationType[] = [
  "MESSAGE",
  "FOLLOW_REQUEST",
  "FOLLOW_ACCEPTED",
  "CONTEST_REGISTRATION",
  "CONTEST_REMINDER",
  "CONTEST_RESULT",
  "ACHIEVEMENT",
  "MILESTONE",
  "ANNOUNCEMENT",
  "LEARNING_REMINDER",
  "LEARNING_PAYMENT",
  "DISCUSSION",
];

const PUSH_TYPE_SET: ReadonlySet<string> = new Set(PUSH_TYPES);

const DEFAULT_PUSH_URL = "/dashboard/notifications";
const PRIVATE_PUSH_BODY = "Open PAU OJ to read it.";
const PRIVATE_TYPES: ReadonlySet<NotificationType> = new Set<NotificationType>([
  "MESSAGE",
  "DISCUSSION",
]);
const MAX_BODY_LENGTH = 140;
const MAX_TITLE_LENGTH = 120;
const MAX_USER_AGENT_LENGTH = 300;
const PUSH_TTL_SECONDS = 3600;
const DEFAULT_VAPID_SUBJECT = "mailto:admin@pauoj.local";

export type PushNotificationInput = {
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
};

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

type VapidConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

/**
 * Read lazily instead of through getEnv so the public-key endpoint and the
 * dispatcher keep answering when the rest of the environment is not ready.
 * The defaults mirror the WEB_PUSH_* defaults in src/server/env.ts.
 */
function readVapidConfig(): VapidConfig {
  return {
    publicKey: (process.env.WEB_PUSH_PUBLIC_KEY ?? "").trim(),
    privateKey: (process.env.WEB_PUSH_PRIVATE_KEY ?? "").trim(),
    subject: (process.env.WEB_PUSH_SUBJECT ?? "").trim() || DEFAULT_VAPID_SUBJECT,
  };
}

export function isPushConfigured(): boolean {
  const { publicKey, privateKey } = readVapidConfig();
  return publicKey.length > 0 && privateKey.length > 0;
}

/** Public VAPID key, or null until the keypair is configured. */
export function getPushPublicKey(): string | null {
  const { publicKey, privateKey } = readVapidConfig();
  return publicKey.length > 0 && privateKey.length > 0 ? publicKey : null;
}

let vapidAppliedFor: string | null = null;

/** Configure the VAPID header once per process; safe to call repeatedly. */
function ensureVapidConfig(): boolean {
  const config = readVapidConfig();
  if (config.publicKey.length === 0 || config.privateKey.length === 0) {
    return false;
  }
  // Compare without logging or exporting the key material.
  const signature = `${config.subject}\u0000${config.publicKey}\u0000${config.privateKey}`;
  if (vapidAppliedFor === signature) return true;
  try {
    setVapidDetails(config.subject, config.publicKey, config.privateKey);
    vapidAppliedFor = signature;
    return true;
  } catch (error) {
    logger.error("Web Push VAPID configuration failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Notification hrefs are stored as in-app paths. Anything that is not a
 * plain same-origin path is replaced with the notification inbox so a bad
 * row can never open a cross-site URL from a notification click.
 */
function safeInAppPath(href: string | null | undefined): string {
  if (!href) return DEFAULT_PUSH_URL;
  const value = href.trim();
  if (value.length === 0 || value.length > 2048) return DEFAULT_PUSH_URL;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_PUSH_URL;
  }
  // Control characters can hide a second line from a browser's URL parser.
  if (/[\u0000-\u001f\u007f]/.test(value)) return DEFAULT_PUSH_URL;
  return value;
}

function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function buildPushPayload(
  notification: PushNotificationInput,
): PushPayload {
  const url = safeInAppPath(notification.href);
  const title = singleLine(notification.title).slice(0, MAX_TITLE_LENGTH);
  const body = PRIVATE_TYPES.has(notification.type)
    ? PRIVATE_PUSH_BODY
    : singleLine(notification.body).slice(0, MAX_BODY_LENGTH);

  return {
    title: title.length > 0 ? title : "PAU OJ",
    body,
    url,
    tag:
      notification.type === "MESSAGE"
        ? `message:${url}`
        : `pauoj:${notification.type}`,
  };
}

export async function savePushSubscription(
  userId: string,
  input: PushSubscribeInput,
  userAgent?: string | null,
): Promise<void> {
  const now = new Date();
  const trimmedAgent = userAgent?.trim().slice(0, MAX_USER_AGENT_LENGTH) ?? "";
  const agent = trimmedAgent.length > 0 ? trimmedAgent : null;

  await getDb()
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: agent,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: agent,
        updatedAt: now,
      },
    });
}

export async function removePushSubscription(
  userId: string,
  endpoint: string,
): Promise<boolean> {
  const removed = await getDb()
    .delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint),
      ),
    )
    .returning({ id: pushSubscriptions.id });
  return removed.length > 0;
}

function pushErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" ? statusCode : null;
}

/**
 * Best-effort fan-out. Push is a side channel: a failure here must never fail
 * the in-app notification that triggered it, so every outcome is swallowed.
 */
export async function sendPushToUser(
  userId: string,
  notification: PushNotificationInput,
): Promise<number> {
  try {
    if (!PUSH_TYPE_SET.has(notification.type)) return 0;
    if (!ensureVapidConfig()) return 0;

    const db = getDb();
    const subscriptions = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) return 0;

    const payload = JSON.stringify(buildPushPayload(notification));
    let sent = 0;

    for (const subscription of subscriptions) {
      try {
        await sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: PUSH_TTL_SECONDS },
        );
        sent += 1;
      } catch (error) {
        const statusCode = pushErrorStatus(error);
        if (statusCode === 404 || statusCode === 410) {
          try {
            await db
              .delete(pushSubscriptions)
              .where(
                and(
                  eq(pushSubscriptions.id, subscription.id),
                  eq(pushSubscriptions.userId, userId),
                ),
              );
          } catch (deleteError) {
            logger.warn("Failed to prune expired push subscription", {
              userId,
              error:
                deleteError instanceof Error
                  ? deleteError.message
                  : String(deleteError),
            });
          }
          continue;
        }
        logger.warn("Push notification delivery failed", {
          userId,
          statusCode,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return sent;
  } catch (error) {
    logger.warn("Push notification dispatch failed", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
