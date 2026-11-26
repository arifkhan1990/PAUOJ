import { ApiClientError, apiPatch, apiRequest } from "@/lib/api-client";
import type { ContestListItem } from "@/lib/contest-detail-types";
import type {
  NotificationFilter,
  NotificationItem,
  PublicAnnouncement,
} from "@/lib/notification-types";

export type NotificationListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  unread: number;
};

export type NotificationFeedPage = {
  items: NotificationItem[];
  meta: NotificationListMeta;
};

export type UnreadCounts = {
  notifications: number;
  messages: number;
  requests: number;
};

type Envelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
  error?: { code?: string; message?: string };
};

/** The list endpoint carries its own `meta.unread`, so parse the envelope here. */
async function getEnvelope<T>(
  path: string,
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
  });

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiClientError(
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? "Request failed. Please try again.",
      response.status,
    );
  }
  if (!payload) {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "The server returned an unexpected response.",
      response.status,
    );
  }

  return { data: payload.data, meta: payload.meta ?? {} };
}

function toCount(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.trunc(parsed));
}

export async function fetchNotifications({
  page,
  filter,
}: {
  page: number;
  filter: NotificationFilter;
}): Promise<NotificationFeedPage> {
  const params = new URLSearchParams({
    page: String(page),
    filter: filter.toLowerCase(),
  });
  const { data, meta } = await getEnvelope<NotificationItem[]>(
    `/api/v1/notifications?${params.toString()}`,
  );
  const items = data ?? [];

  return {
    items,
    meta: {
      page: toCount(meta.page, page) || page,
      pageSize: toCount(meta.pageSize, 20) || 20,
      total: toCount(meta.total, items.length),
      totalPages: Math.max(1, toCount(meta.totalPages, 1)),
      unread: toCount(meta.unread),
    },
  };
}

export async function markAllNotificationsRead(): Promise<{
  marked: number;
  unread: number;
}> {
  const result = await apiPatch<{
    ok?: boolean;
    marked?: number;
    unread?: number;
  }>("/api/v1/notifications/read", {});
  return { marked: toCount(result?.marked), unread: toCount(result?.unread) };
}

/**
 * Per-item read. Uses `keepalive` so the request survives the link navigation
 * that immediately follows the click.
 */
export async function markNotificationRead(
  id: string,
): Promise<{ readAt: string; unread: number }> {
  const result = await apiRequest<{
    ok?: boolean;
    readAt?: string;
    unread?: number;
  }>(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    body: JSON.stringify({}),
    keepalive: true,
  });
  return {
    readAt: result?.readAt ?? new Date().toISOString(),
    unread: toCount(result?.unread),
  };
}

export async function fetchAnnouncements(
  limit = 10,
): Promise<PublicAnnouncement[]> {
  const announcements = await apiRequest<PublicAnnouncement[]>(
    `/api/v1/announcements?limit=${limit}`,
  );
  return announcements ?? [];
}

/**
 * Live and upcoming contests for the guest drawer: drop ended rounds, put live
 * rounds first, then the nearest upcoming rounds, capped to five rows.
 */
export async function fetchActiveContests(): Promise<ContestListItem[]> {
  const contests = await apiRequest<ContestListItem[]>(
    "/api/v1/contests?filter=ALL&page=1&pageSize=8",
  );
  return [...(contests ?? [])]
    .filter((contest) => contest.status !== "ENDED")
    .sort((a, b) => {
      const rank = (contest: ContestListItem) =>
        contest.status === "RUNNING" ? 0 : 1;
      const byStatus = rank(a) - rank(b);
      if (byStatus !== 0) return byStatus;
      return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
    })
    .slice(0, 5);
}

export async function fetchUnreadCounts(): Promise<UnreadCounts> {
  const counts = await apiRequest<{
    notifications?: number;
    messages?: number;
    requests?: number;
  }>("/api/v1/social/counts");
  return {
    notifications: toCount(counts?.notifications),
    messages: toCount(counts?.messages),
    requests: toCount(counts?.requests),
  };
}
