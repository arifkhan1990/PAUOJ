import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { MarkAllReadButton } from "@/features/notifications/mark-all-read";
import { NotificationGroupList } from "@/features/notifications/notification-group-list";
import { NOTIFICATION_TYPE_META } from "@/features/notifications/notification-type-meta";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/server/auth/guards";
import {
  NOTIFICATIONS_PAGE_SIZE,
  getUnreadNotificationCount,
  listNotifications,
} from "@/server/services/notifications";
import { readPage, type SearchParams } from "@/lib/pagination";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Verdicts, contest updates, learning progress, badges, announcements and messages in one place.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser("/dashboard/notifications");
  const query = await searchParams;
  const page = readPage(query);
  const [result, unread] = await Promise.all([
    listNotifications(user.id, {
      page,
      pageSize: NOTIFICATIONS_PAGE_SIZE,
    }),
    getUnreadNotificationCount(user.id),
  ]);
  const totalPages = Math.max(
    1,
    Math.ceil(result.total / NOTIFICATIONS_PAGE_SIZE),
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description={
          unread > 0
            ? `${unread} unread ${unread === 1 ? "update" : "updates"} for you.`
            : "Contest updates, verdicts, learning progress, badges, announcements and messages."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/settings#notifications"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Settings className="size-3.5" /> Preferences
            </Link>
            {unread > 0 ? <MarkAllReadButton /> : null}
          </div>
        }
      />

      <div>
        {result.items.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="Join a contest, submit a solution or start a learning module to see updates here."
            icon={Bell}
            action={
              <Link href="/problems" className={buttonVariants()}>
                Browse problems
              </Link>
            }
          />
        ) : (
          <NotificationGroupList
            items={result.items}
            typeMeta={NOTIFICATION_TYPE_META}
          />
        )}
      </div>

      <Pagination
        pathname="/dashboard/notifications"
        searchParams={query}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
