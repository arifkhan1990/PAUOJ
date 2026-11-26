import { and, count, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { notifications } from "@/server/db/schema";
import { errors } from "@/server/api/errors";

/** Unread badge count for the viewer; always scoped by `user_id`. */
export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
  return Number(row?.value ?? 0);
}

/** Marks every unread row as read and reports how many changed. */
export async function markAllNotificationsRead(
  userId: string,
): Promise<number> {
  const marked = await getDb()
    .update(notifications)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    )
    .returning({ id: notifications.id });
  return marked.length;
}

/**
 * Marks one owned notification as read. Re-reading an already-read row keeps
 * its original timestamp, which makes the call idempotent for the client.
 */
export async function markNotificationRead(
  userId: string,
  id: string,
): Promise<{ readAt: string; unread: number }> {
  const now = new Date();
  const [row] = await getDb()
    .update(notifications)
    .set({
      readAt: sql`coalesce(${notifications.readAt}, now())`,
      updatedAt: now,
    })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .returning({ readAt: notifications.readAt });

  if (!row) throw errors.notFound("That notification could not be found.");

  const unread = await getUnreadNotificationCount(userId);
  return { readAt: (row.readAt ?? now).toISOString(), unread };
}
