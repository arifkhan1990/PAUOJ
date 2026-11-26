"use client";

import Link from "next/link";
import type { NotificationItem } from "@/lib/notification-types";
import { cn, formatRelative } from "@/lib/utils";
import {
  NOTIFICATION_TYPE_META,
  notificationChipLabel,
} from "./notification-type-meta";

/** One drawer row: icon tile, title, category chip, relative time and body. */
export function NotificationRow({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: (item: NotificationItem) => void;
}) {
  const meta = NOTIFICATION_TYPE_META[item.type];
  const Icon = meta.icon;
  const chip = notificationChipLabel(item.type);
  const unread = !item.readAt;

  const content = (
    <div
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors",
        unread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50",
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
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 break-words text-sm font-medium">
            {item.title}
          </p>
          {unread ? (
            <span
              role="img"
              aria-label="Unread"
              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
            />
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          {chip ? (
            <span className="rounded border border-border bg-muted px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide">
              {chip}
            </span>
          ) : null}
          <time dateTime={item.createdAt}>
            {formatRelative(item.createdAt)}
          </time>
        </div>
        {item.body ? (
          <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-muted-foreground">
            {item.body}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (item.href) {
    return (
      <li>
        <Link
          href={item.href}
          onClick={() => onRead(item)}
          className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => onRead(item)}
        className="block w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {content}
      </button>
    </li>
  );
}
