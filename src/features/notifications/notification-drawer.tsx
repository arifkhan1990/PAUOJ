"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";
import { ApiClientError } from "@/lib/api-client";
import type {
  NotificationFilter,
  NotificationItem,
} from "@/lib/notification-types";
import {
  fetchActiveContests,
  fetchAnnouncements,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationListMeta,
} from "./notification-api";
import {
  NotificationDrawerContent,
  type NotificationActionNotice,
  type NotificationFeedView,
} from "./notification-drawer-content";
import {
  PublicUpdatesContent,
  type PublicAnnouncementState,
  type PublicContestState,
  type PublicUpdatesTab,
} from "./public-updates-content";

const INITIAL_META: NotificationListMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
  unread: 0,
};

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiClientError ? error.message : fallback;
}

function useNotificationFeed({
  active,
  tab,
  onUnreadChange,
}: {
  active: boolean;
  tab: NotificationFilter;
  onUnreadChange: (unread: number) => void;
}) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [meta, setMeta] = useState<NotificationListMeta>(INITIAL_META);
  const [allTotal, setAllTotal] = useState(0);
  const [status, setStatus] =
    useState<NotificationFeedView["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [notice, setNotice] = useState<NotificationActionNotice | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (notice?.kind !== "success") return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const load = useCallback(
    async (page: number) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setError(null);
      if (page === 1) {
        setNotice(null);
        setItems([]);
        setStatus("loading");
      } else {
        setLoadingMore(true);
      }
      try {
        const result = await fetchNotifications({ page, filter: tab });
        if (requestRef.current !== requestId) return;
        setItems((previous) =>
          page === 1 ? result.items : [...previous, ...result.items],
        );
        setMeta(result.meta);
        setStatus("ready");
        if (tab === "ALL") setAllTotal(result.meta.total);
        onUnreadChange(result.meta.unread);
      } catch (caught) {
        if (requestRef.current !== requestId) return;
        setError(errorMessage(caught, "Could not load notifications."));
        setStatus("error");
      } finally {
        if (requestRef.current === requestId) setLoadingMore(false);
      }
    },
    [tab, onUnreadChange],
  );

  useEffect(() => {
    if (!active) return;
    void load(1);
  }, [active, load]);

  const markAllRead = useCallback(async () => {
    if (markingAll || meta.unread === 0) return;
    const previousItems = items;
    const previousMeta = meta;
    const readAt = new Date().toISOString();
    setMarkingAll(true);
    setItems((previous) =>
      tab === "UNREAD"
        ? []
        : previous.map((item) => (item.readAt ? item : { ...item, readAt })),
    );
    setMeta((previous) => ({
      ...previous,
      unread: 0,
      ...(tab === "UNREAD" ? { page: 1, total: 0, totalPages: 1 } : {}),
    }));
    try {
      const result = await markAllNotificationsRead();
      setMeta((previous) => ({ ...previous, unread: result.unread }));
      onUnreadChange(result.unread);
      setNotice({
        kind: "success",
        message:
          result.marked > 0
            ? `Marked ${result.marked} ${result.marked === 1 ? "notification" : "notifications"} as read.`
            : "All notifications are already read.",
      });
    } catch (caught) {
      setItems(previousItems);
      setMeta(previousMeta);
      setNotice({
        kind: "error",
        message: errorMessage(
          caught,
          "Could not mark notifications read. Please try again.",
        ),
      });
    } finally {
      setMarkingAll(false);
    }
  }, [items, markingAll, meta, onUnreadChange, tab]);

  const markRead = useCallback(
    async (item: NotificationItem) => {
      if (item.readAt) return;
      const previousItems = items;
      const previousMeta = meta;
      const readAt = new Date().toISOString();
      setItems((previous) =>
        previous
          .map((row) => (row.id === item.id ? { ...row, readAt } : row))
          .filter((row) => (tab === "UNREAD" ? row.id !== item.id : true)),
      );
      setMeta((previous) => ({
        ...previous,
        unread: Math.max(0, previous.unread - 1),
        ...(tab === "UNREAD"
          ? { total: Math.max(0, previous.total - 1) }
          : {}),
      }));
      try {
        const result = await markNotificationRead(item.id);
        setMeta((previous) => ({ ...previous, unread: result.unread }));
        onUnreadChange(result.unread);
      } catch (caught) {
        setItems(previousItems);
        setMeta(previousMeta);
        setNotice({
          kind: "error",
          message: errorMessage(
            caught,
            "Could not mark the notification read. Please try again.",
          ),
        });
      }
    },
    [items, meta, onUnreadChange, tab],
  );

  const feed: NotificationFeedView = {
    items,
    meta,
    allTotal,
    status,
    error,
    loadingMore,
    markingAll,
    notice,
    onDismissNotice: () => setNotice(null),
  };

  return {
    feed,
    reload: () => void load(1),
    loadMore: () => {
      if (meta.page < meta.totalPages && !loadingMore) void load(meta.page + 1);
    },
    markAllRead,
    markRead,
  };
}

function usePublicUpdates(active: boolean) {
  const [announcements, setAnnouncements] = useState<PublicAnnouncementState>({
    status: "loading",
    items: [],
  });
  const [contests, setContests] = useState<PublicContestState>({
    status: "loading",
    items: [],
  });

  const loadAnnouncements = useCallback(async () => {
    setAnnouncements((previous) => ({ status: "loading", items: previous.items }));
    try {
      setAnnouncements({ status: "ready", items: await fetchAnnouncements(10) });
    } catch {
      setAnnouncements({ status: "error", items: [] });
    }
  }, []);

  const loadContests = useCallback(async () => {
    setContests((previous) => ({ status: "loading", items: previous.items }));
    try {
      setContests({ status: "ready", items: await fetchActiveContests() });
    } catch {
      setContests({ status: "error", items: [] });
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void loadAnnouncements();
    void loadContests();
  }, [active, loadAnnouncements, loadContests]);

  return { announcements, contests, loadAnnouncements, loadContests };
}

/**
 * Navbar notification sheet. Signed-in users get the paginated personal feed;
 * guests get public announcements and live/upcoming contests only.
 */
export function NotificationDrawer({
  open,
  signedIn,
  unread,
  onOpenChange,
  onUnreadChange,
}: {
  open: boolean;
  signedIn: boolean;
  unread: number;
  onOpenChange: (open: boolean) => void;
  onUnreadChange: (unread: number) => void;
}) {
  const pathname = usePathname();
  const lastPathname = useRef(pathname);
  const [tab, setTab] = useState<NotificationFilter>("ALL");
  const [publicTab, setPublicTab] = useState<PublicUpdatesTab>("announcements");

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  const feedState = useNotificationFeed({
    active: open && signedIn,
    tab,
    onUnreadChange,
  });
  const publicState = usePublicUpdates(open && !signedIn);

  const liveUnread =
    signedIn && feedState.feed.status === "ready"
      ? feedState.feed.meta.unread
      : unread;
  const description = signedIn
    ? liveUnread > 0
      ? `${liveUnread} unread`
      : "You're all caught up"
    : "Announcements and upcoming contests";

  return (
    <Drawer
      open={open}
      title={signedIn ? "Notifications" : "Updates"}
      description={description}
      onClose={close}
      closeLabel={signedIn ? "Close notifications" : "Close updates"}
    >
      {signedIn ? (
        <NotificationDrawerContent
          feed={feedState.feed}
          activeTab={tab}
          onTabChange={setTab}
          onRetry={feedState.reload}
          onLoadMore={feedState.loadMore}
          onMarkAllRead={() => void feedState.markAllRead()}
          onMarkRead={(item) => {
            void feedState.markRead(item);
            if (item.href) close();
          }}
          onNavigate={close}
        />
      ) : (
        <PublicUpdatesContent
          tab={publicTab}
          onTabChange={setPublicTab}
          announcements={publicState.announcements}
          contests={publicState.contests}
          onRetryAnnouncements={() => void publicState.loadAnnouncements()}
          onRetryContests={() => void publicState.loadContests()}
          onNavigate={close}
        />
      )}
    </Drawer>
  );
}
