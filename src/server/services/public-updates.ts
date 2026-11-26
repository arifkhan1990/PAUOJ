import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { broadcasts } from "@/server/db/schema";
import type { PublicAnnouncement } from "@/lib/notification-types";
import { safeInternalHref } from "@/lib/safe-internal-href";

export { safeInternalHref } from "@/lib/safe-internal-href";

const MAX_ANNOUNCEMENTS = 20;
const DEFAULT_ANNOUNCEMENTS = 10;

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return DEFAULT_ANNOUNCEMENTS;
  return Math.min(MAX_ANNOUNCEMENTS, Math.max(1, Math.trunc(limit)));
}

/**
 * Public announcement feed for the navbar drawer. Only completed announcements
 * are public, so a queued/retrying fan-out cannot disagree with the signed-in
 * feed. Baseline rows are migration history markers, and no user columns are
 * touched, so this never leaks PII.
 */
export async function listPublicAnnouncements(
  limit = DEFAULT_ANNOUNCEMENTS,
): Promise<PublicAnnouncement[]> {
  const rows = await getDb()
    .select({
      id: broadcasts.id,
      title: broadcasts.title,
      body: broadcasts.body,
      href: broadcasts.href,
      createdAt: broadcasts.createdAt,
    })
    .from(broadcasts)
    .where(
      and(
        eq(broadcasts.kind, "ANNOUNCEMENT"),
        eq(broadcasts.baseline, false),
        isNotNull(broadcasts.completedAt),
      ),
    )
    .orderBy(desc(broadcasts.createdAt))
    .limit(clampLimit(limit));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    href: safeInternalHref(row.href),
    createdAt: row.createdAt.toISOString(),
  }));
}
