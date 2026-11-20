import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  FilePenLine,
  MessageSquare,
  Settings,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { MarkAllReadButton } from "@/features/notifications/mark-all-read";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/auth/guards";
import {
  NOTIFICATIONS_PAGE_SIZE,
  getUnreadNotificationCount,
  listNotifications,
} from "@/server/services/notifications";
import type { NotificationType } from "@/lib/notification-types";
import { readPage, type SearchParams } from "@/lib/pagination";
import { cn, formatRelative } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Verdicts, contest starts, clarification answers, problem contributions and contest approvals.",
};

export const dynamic = "force-dynamic";

const TYPE_META: Record<
  NotificationType,
  { icon: typeof Bell; className: string }
> = {
  VERDICT: {
    icon: CheckCircle2,
    className: "bg-primary/10 text-primary",
  },
  CONTEST_START: {
    icon: Trophy,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  CLARIFICATION: {
    icon: MessageSquare,
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  CONTRIBUTION: {
    icon: FilePenLine,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  CONTEST_APPROVAL: {
    icon: ShieldCheck,
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  SYSTEM: {
    icon: Bell,
    className: "bg-muted text-muted-foreground",
  },
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser("/notifications");
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
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description={
          unread > 0
            ? `${unread} unread ${unread === 1 ? "update" : "updates"} for you.`
            : "Verdicts, contest starts, clarification answers, problem contributions and contest approvals."
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

      <div className="mt-6">
        {result.items.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="Submit a solution or join a contest to start receiving updates."
            icon={Bell}
            action={
              <Link href="/problems" className={buttonVariants()}>
                Browse problems
              </Link>
            }
          />
        ) : (
          <Card className="overflow-hidden p-1">
            <ul className="divide-y divide-border">
              {result.items.map((item) => {
                const meta = TYPE_META[item.type];
                const Icon = meta.icon;
                const content = (
                  <div
                    className={cn(
                      "flex gap-3 rounded-md px-3 py-3.5 transition-colors",
                      item.readAt ? "hover:bg-muted/50" : "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full",
                        meta.className,
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{item.title}</p>
                        {!item.readAt ? (
                          <span
                            className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                            aria-label="Unread"
                          />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatRelative(item.createdAt)}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <Link href={item.href} className="block">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      <Pagination
        pathname="/notifications"
        searchParams={query}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
