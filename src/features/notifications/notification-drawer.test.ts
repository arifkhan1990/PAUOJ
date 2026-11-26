import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { ContestListItem } from "@/lib/contest-detail-types";
import type {
  NotificationItem,
  PublicAnnouncement,
} from "@/lib/notification-types";
import {
  NotificationDrawerContent,
  type NotificationFeedView,
} from "./notification-drawer-content";
import {
  PublicUpdatesContent,
  type PublicAnnouncementState,
  type PublicContestState,
} from "./public-updates-content";

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function notification(
  overrides: Partial<NotificationItem> = {},
): NotificationItem {
  return {
    id: "n1",
    type: "ANNOUNCEMENT",
    title: "Autumn round announced",
    body: "The next official round is now open for registration.",
    href: "/contests/autumn-round",
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function feed(overrides: Partial<NotificationFeedView> = {}): NotificationFeedView {
  return {
    items: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1, unread: 0 },
    allTotal: 0,
    status: "ready",
    error: null,
    loadingMore: false,
    markingAll: false,
    notice: null,
    onDismissNotice: vi.fn(),
    ...overrides,
  };
}

function renderContent({
  view = feed(),
  activeTab = "ALL",
}: {
  view?: NotificationFeedView;
  activeTab?: "ALL" | "UNREAD" | "NOTICE";
} = {}): string {
  return renderToStaticMarkup(
    createElement(NotificationDrawerContent, {
      feed: view,
      activeTab,
      onTabChange: vi.fn(),
      onRetry: vi.fn(),
      onLoadMore: vi.fn(),
      onMarkAllRead: vi.fn(),
      onMarkRead: vi.fn(),
      onNavigate: vi.fn(),
    }),
  );
}

function contest(overrides: Partial<ContestListItem> = {}): ContestListItem {
  return {
    id: "c1",
    slug: "autumn-cup",
    title: "Autumn Cup",
    description: "A rated round.",
    bannerUrl: null,
    startAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    status: "UPCOMING",
    division: "OPEN",
    format: "ICPC",
    teamSize: 1,
    isOfficial: true,
    seriesId: null,
    feeStatus: "NOT_REQUIRED",
    sponsor: null,
    freezeMinutes: 0,
    participantCount: 0,
    problemCount: 0,
    registered: false,
    ...overrides,
  } as ContestListItem;
}

function announcement(
  overrides: Partial<PublicAnnouncement> = {},
): PublicAnnouncement {
  return {
    id: "a1",
    title: "Server maintenance window",
    body: "The judge pauses for 20 minutes on Sunday night.",
    href: "/notices/maintenance",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPublic({
  tab = "announcements",
  announcements = { status: "ready", items: [] } as PublicAnnouncementState,
  contests = { status: "ready", items: [] } as PublicContestState,
}: {
  tab?: "announcements" | "contests";
  announcements?: PublicAnnouncementState;
  contests?: PublicContestState;
} = {}): string {
  return renderToStaticMarkup(
    createElement(PublicUpdatesContent, {
      tab,
      onTabChange: vi.fn(),
      announcements,
      contests,
      onRetryAnnouncements: vi.fn(),
      onRetryContests: vi.fn(),
      onNavigate: vi.fn(),
    }),
  );
}

describe("NotificationDrawerContent", () => {
  it("renders tabs, category chips, unread dot, body and relative time", () => {
    const html = renderContent({
      view: feed({
        items: [
          notification(),
          notification({
            id: "n2",
            type: "MARKETING",
            title: "New learning path",
            body: "A fresh interview-prep track is live.",
            href: null,
            readAt: new Date().toISOString(),
          }),
          notification({
            id: "n3",
            type: "CONTEST_START",
            title: "Weekly round starts soon",
            body: "Warm up before the bell.",
            readAt: new Date().toISOString(),
          }),
        ],
        meta: { page: 1, pageSize: 20, total: 42, totalPages: 3, unread: 1 },
        allTotal: 42,
      }),
    });
    const plain = text(html);

    expect(html).toContain('role="tablist"');
    expect(plain).toContain("All");
    expect(plain).toContain("Unread");
    expect(plain).toContain("Notices");
    expect(plain).toContain("Notice");
    expect(plain).toContain("News");
    expect(plain).toContain("Contest");
    expect(html).toContain('aria-label="Unread"');
    expect(plain).toContain("The next official round is now open for registration.");
    expect(plain).toContain("just now");
    expect(plain).toContain("Mark all read");
    expect(plain).toContain("Load more");
    expect(html).toContain('href="/dashboard/notifications"');
    expect(html).toContain('href="/settings#notifications"');
    expect(plain).toContain("View all notifications");
    expect(plain).toContain("Preferences");
  });

  it("renders the per-item button when a notification has no link", () => {
    const html = renderContent({
      view: feed({
        items: [notification({ href: null })],
        meta: { page: 1, pageSize: 20, total: 1, totalPages: 1, unread: 1 },
      }),
    });

    expect(html).toContain("<button");
    expect(html).not.toContain('href="/contests/autumn-round"');
  });

  it("shows the all-empty state with a browse CTA", () => {
    const plain = text(renderContent({ activeTab: "ALL" }));

    expect(plain).toContain("No notifications yet");
    expect(plain).toContain("Browse problems");
  });

  it("shows the caught-up state for the unread tab", () => {
    const plain = text(renderContent({ activeTab: "UNREAD" }));

    expect(plain).toContain("all caught up");
    expect(plain).not.toContain("No notifications yet");
  });

  it("shows the notices empty state with a contests CTA", () => {
    const plain = text(renderContent({ activeTab: "NOTICE" }));

    expect(plain).toContain("No notices yet");
    expect(plain).toContain("View contests");
  });

  it("renders an error state with retry", () => {
    const html = renderContent({
      view: feed({ status: "error", error: "Network down" }),
    });
    const plain = text(html);

    expect(plain).toContain("Could not load notifications");
    expect(plain).toContain("Network down");
    expect(plain).toContain("Retry");
  });

  it("renders mark-all feedback inline because toasts sit behind the dialog", () => {
    const html = renderContent({
      view: feed({
        notice: {
          kind: "success",
          message: "Marked 3 notifications as read.",
        },
      }),
    });

    expect(text(html)).toContain("Marked 3 notifications as read.");
    expect(html).toContain('aria-label="Dismiss message"');
  });

  it("renders skeleton rows while loading", () => {
    const html = renderContent({ view: feed({ status: "loading" }) });

    expect(html).toContain('aria-label="Loading notifications"');
    expect(html).toContain("skeleton-shimmer");
    expect(text(html)).not.toContain("No notifications yet");
  });

  it("hides load more on the last page", () => {
    const html = renderContent({
      view: feed({
        items: [notification({ readAt: new Date().toISOString() })],
        meta: { page: 3, pageSize: 20, total: 42, totalPages: 3, unread: 0 },
      }),
    });

    expect(text(html)).not.toContain("Load more");
  });

  it("groups rows into Today, Yesterday and Earlier", () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const html = renderContent({
      view: feed({
        items: [
          notification({ createdAt: today.toISOString() }),
          notification({ id: "n2", createdAt: yesterday.toISOString() }),
          notification({ id: "n3", createdAt: "2025-01-02T10:00:00.000Z" }),
        ],
        meta: { page: 1, pageSize: 20, total: 3, totalPages: 1, unread: 1 },
      }),
    });
    const plain = text(html);

    expect(plain).toContain("Today");
    expect(plain).toContain("Yesterday");
    expect(plain).toContain("Earlier");
    expect(plain.indexOf("Today")).toBeLessThan(plain.indexOf("Earlier"));
  });
});

describe("PublicUpdatesContent", () => {
  it("renders announcements with a safe internal link", () => {
    const html = renderPublic({
      announcements: { status: "ready", items: [announcement()] },
    });
    const plain = text(html);

    expect(html).toContain('role="tablist"');
    expect(plain).toContain("Announcements");
    expect(plain).toContain("Contests");
    expect(plain).toContain("Server maintenance window");
    expect(html).toContain('href="/notices/maintenance"');
    expect(plain).toContain("Sign in for personal alerts");
    expect(plain).toContain("Browse contests");
  });

  it("drops unsafe announcement hrefs", () => {
    const html = renderPublic({
      announcements: {
        status: "ready",
        items: [announcement({ href: "javascript:alert(1)" })],
      },
    });

    expect(html).not.toContain("javascript:");
    expect(text(html)).toContain("Server maintenance window");
  });

  it("marks live contests and lists upcoming start times", () => {
    const html = renderPublic({
      tab: "contests",
      contests: {
        status: "ready",
        items: [
          contest({
            id: "c1",
            slug: "live-cup",
            title: "Live Cup",
            status: "RUNNING",
          }),
          contest({ id: "c2", slug: "winter-cup", title: "Winter Cup" }),
        ],
      },
    });
    const plain = text(html);

    expect(plain).toContain("Live now");
    expect(plain).toContain("Live Cup");
    expect(plain).toContain("Winter Cup");
    expect(plain).toContain("Starts");
    expect(plain).toMatch(/\d{2} [A-Z][a-z]{2} \d{4}, \d{2}:\d{2}/);
    expect(html).toContain('href="/contests/live-cup"');
    expect(html).toContain('href="/contests/winter-cup"');
    expect(plain.indexOf("Live Cup")).toBeLessThan(plain.indexOf("Winter Cup"));
  });

  it("shows guest error and empty states", () => {
    const error = text(
      renderPublic({
        announcements: { status: "error", items: [] },
      }),
    );
    expect(error).toContain("Could not load announcements");
    expect(error).toContain("Retry");

    const empty = text(
      renderPublic({
        tab: "contests",
        contests: { status: "ready", items: [] },
      }),
    );
    expect(empty).toContain("No contests scheduled");
  });
});
