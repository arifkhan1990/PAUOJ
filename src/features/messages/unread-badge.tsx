"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const UNREAD_EVENT = "pauoj:messages-unread";
const POLL_INTERVAL_MS = 45_000;

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

/**
 * Keeps a client-side unread count in sync with the header poller.
 * Other components (the user menu) listen without polling themselves.
 */
export function useUnreadMessageCount(initialCount: number): number {
  const [count, setCount] = useState(() => sanitizeCount(initialCount));

  useEffect(() => {
    setCount(sanitizeCount(initialCount));
  }, [initialCount]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (typeof detail === "number") setCount(sanitizeCount(detail));
    };
    window.addEventListener(UNREAD_EVENT, onUpdate);
    return () => window.removeEventListener(UNREAD_EVENT, onUpdate);
  }, []);

  return count;
}

/** Header icon button with a live unread badge; polls every 45s while visible. */
export function MessagesHeaderLink({
  initialCount,
  className,
}: {
  initialCount: number;
  className?: string;
}) {
  const [count, setCount] = useState(() => sanitizeCount(initialCount));

  useEffect(() => {
    let active = true;

    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const result = await apiRequest<{ count: number }>(
          "/api/v1/messages/unread",
        );
        if (!active) return;
        const next = sanitizeCount(result.count);
        setCount(next);
        window.dispatchEvent(
          new CustomEvent<number>(UNREAD_EVENT, { detail: next }),
        );
      } catch {
        // Best-effort badge refresh; keep the last known count.
      }
    };

    void sync();
    const interval = window.setInterval(() => void sync(), POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <Link
      href="/messages"
      aria-label={count > 0 ? `Messages, ${count} unread` : "Messages"}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "relative",
        className,
      )}
    >
      <MessageSquare className="size-4" aria-hidden="true" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
