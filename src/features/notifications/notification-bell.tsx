"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUnreadBadge } from "./notification-date-groups";
import { fetchUnreadCounts } from "./notification-api";
import { NotificationDrawer } from "./notification-drawer";

const POLL_INTERVAL_MS = 45_000;

/**
 * Navbar bell. Signed-in users see an unread badge that refreshes every 45s
 * while the tab is visible, on tab return and on window focus; guests see the
 * same control without a count.
 */
export function NotificationBell({
  signedIn,
  initialUnread,
}: {
  signedIn: boolean;
  initialUnread: number;
}) {
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const counts = await fetchUnreadCounts();
        if (!cancelled) setUnread(counts.notifications);
      } catch {
        // Badging is best-effort; the drawer surfaces load errors to the user.
      }
    };

    const start = () => {
      if (interval !== null) return;
      interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (interval === null) return;
      clearInterval(interval);
      interval = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") {
      void refresh();
      start();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, [signedIn]);

  const badge = signedIn ? formatUnreadBadge(unread) : null;
  const label = signedIn
    ? `Open notifications, ${unread} unread`
    : "Open announcements and upcoming contests";

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative min-h-11 min-w-11 lg:min-h-9 lg:min-w-9"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Bell className="size-5" aria-hidden="true" />
        {badge ? (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none tabular-nums text-destructive-foreground"
          >
            {badge}
          </span>
        ) : null}
      </Button>
      <NotificationDrawer
        open={open}
        signedIn={signedIn}
        unread={unread}
        onOpenChange={setOpen}
        onUnreadChange={setUnread}
      />
    </>
  );
}
