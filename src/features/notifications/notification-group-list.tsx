import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { NotificationItem, NotificationType } from "@/lib/notification-types";
import { groupNotifications } from "@/lib/notification-groups";
import { cn, formatRelative } from "@/lib/utils";

export type NotificationTypeMeta = Record<
  NotificationType,
  { icon: typeof Bell; className: string }
>;

function NotificationRow({
  item,
  meta,
}: {
  item: NotificationItem;
  meta: { icon: typeof Bell; className: string };
}) {
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
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 break-words text-sm font-medium">{item.title}</p>
          {!item.readAt ? (
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
            />
          ) : null}
        </div>
        <p className="mt-0.5 break-words text-xs leading-relaxed text-muted-foreground">
          {item.body}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {formatRelative(item.createdAt)}
        </p>
      </div>
    </div>
  );

  return item.href ? (
    <Link href={item.href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export function NotificationGroupList({
  items,
  typeMeta,
}: {
  items: NotificationItem[];
  typeMeta: NotificationTypeMeta;
}) {
  const groups = groupNotifications(items);

  return (
    <Card className="overflow-hidden p-1">
      <ul className="divide-y divide-border">
        {groups.map((group) => {
          const meta = typeMeta[group.type];
          const Icon = meta.icon;

          if (group.items.length === 1) {
            const item = group.items[0];
            return (
              <li key={group.key}>
                <NotificationRow item={item} meta={meta} />
              </li>
            );
          }

          return (
            <li key={group.key}>
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-md px-3 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-full",
                      meta.className,
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium">{group.label}</span>
                      <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                        {group.items.length} updates
                      </span>
                      {group.unread > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                          <span
                            className="size-1.5 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                          {group.unread} unread
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      Latest {formatRelative(group.latestAt)}
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="divide-y divide-border border-t border-border">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <NotificationRow item={item} meta={meta} />
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
