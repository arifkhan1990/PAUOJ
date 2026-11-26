import { and, count, eq, gte, like } from "drizzle-orm";
import { getDb } from "@/server/db";
import { notifications, users } from "@/server/db/schema";
import { logger } from "@/server/logger";
import type { PaymentOrderView } from "./learning-payments";
import { notifyUser } from "./notifications";

/** Admins get one in-app notice per new order; this queue never emails them. */
export function adminOrderNotification(
  order: PaymentOrderView,
): { title: string; body: string } {
  const who = `@${order.user.username}`;
  if (order.kind === "FREE_REQUEST") {
    return {
      title: "Free access request needs review",
      body: `${who} requested ${order.label}.`,
    };
  }
  return {
    title: "Payment needs review",
    body: `${who} submitted a payment for ${order.label}.`,
  };
}

/** Per-order admin notices allowed per admin in the rolling window. */
export const ADMIN_ORDER_NOTIFICATION_CAP = 10;
export const ADMIN_ORDER_NOTIFICATION_WINDOW_MS = 60 * 60 * 1000;

/** One digest bucket per UTC hour; never matches the `admin-order:%` pattern. */
export function adminOrderDigestKey(now = new Date()): string {
  return `admin-order-digest:${now.toISOString().slice(0, 13)}`;
}

/** True while the admin is still under the rolling per-order cap. */
export function underAdminOrderNotificationCap(recentCount: number): boolean {
  return recentCount < ADMIN_ORDER_NOTIFICATION_CAP;
}

const ADMIN_ORDER_DIGEST = {
  title: "More access requests are waiting",
  body: "More payments or free-access requests need review in the admin queue.",
  href: "/admin/payments",
} as const;

/**
 * Admins are notified after the order is stored. A notification failure never
 * turns a successfully stored order into an error for the learner. Past the
 * rolling cap each admin gets one hourly digest instead of per-order rows, so
 * the badge and the admin queue still show the true pending count.
 */
export async function notifyAdminsOfNewOrder(
  order: PaymentOrderView,
): Promise<void> {
  try {
    const admins = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "ADMIN"), eq(users.isBanned, false)));
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - ADMIN_ORDER_NOTIFICATION_WINDOW_MS,
    );
    const { title, body } = adminOrderNotification(order);
    const results = await Promise.allSettled(
      admins.map(async (admin) => {
        const [row] = await getDb()
          .select({ value: count() })
          .from(notifications)
          .where(
            and(
              eq(notifications.userId, admin.id),
              eq(notifications.type, "SYSTEM"),
              like(notifications.dedupeKey, "admin-order:%"),
              gte(notifications.createdAt, windowStart),
            ),
          );
        const recent = Number(row?.value ?? 0);
        const notice = underAdminOrderNotificationCap(recent)
          ? {
              title,
              body,
              href: ADMIN_ORDER_DIGEST.href,
              dedupeKey: `admin-order:${order.id}`,
            }
          : { ...ADMIN_ORDER_DIGEST, dedupeKey: adminOrderDigestKey(now) };
        return notifyUser({
          userId: admin.id,
          type: "SYSTEM",
          email: false,
          ...notice,
        });
      }),
    );
    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      logger.warn("Learning payment admin notification failed", {
        orderId: order.id,
        failed: failed.length,
      });
    }
  } catch (error) {
    logger.warn("Learning payment admin notification failed", {
      orderId: order.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
