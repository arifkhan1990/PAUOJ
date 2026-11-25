import { describe, expect, it } from "vitest";
import type { NotificationItem } from "@/lib/notification-types";
import {
  groupNotifications,
  NOTIFICATION_GROUP_LABELS,
  utcDayKey,
} from "@/lib/notification-groups";

function notification(
  overrides: Partial<NotificationItem> & { id: string },
): NotificationItem {
  return {
    type: "VERDICT",
    title: `Notification ${overrides.id}`,
    body: "Body",
    href: null,
    readAt: null,
    createdAt: "2026-11-25T10:00:00.000Z",
    ...overrides,
  };
}

describe("utcDayKey", () => {
  it("uses the UTC calendar day", () => {
    expect(utcDayKey("2026-11-25T23:59:59.000Z")).toBe("2026-11-25");
    expect(utcDayKey("2026-11-26T00:00:00.000Z")).toBe("2026-11-26");
  });
});

describe("groupNotifications", () => {
  it("collapses the same type on the same UTC day", () => {
    const items = [
      notification({
        id: "a",
        createdAt: "2026-11-25T12:00:00.000Z",
        readAt: "2026-11-25T12:30:00.000Z",
      }),
      notification({ id: "b", createdAt: "2026-11-25T09:00:00.000Z" }),
    ];

    const groups = groupNotifications(items);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("VERDICT:2026-11-25");
    expect(groups[0].label).toBe(NOTIFICATION_GROUP_LABELS.VERDICT);
    expect(groups[0].items.map((item) => item.id)).toEqual(["a", "b"]);
    expect(groups[0].latestAt).toBe("2026-11-25T12:00:00.000Z");
    expect(groups[0].unread).toBe(1);
  });

  it("keeps different UTC days separate, newest first", () => {
    const items = [
      notification({ id: "yesterday", createdAt: "2026-11-24T20:00:00.000Z" }),
      notification({ id: "today", createdAt: "2026-11-25T08:00:00.000Z" }),
    ];

    const groups = groupNotifications(items);

    expect(groups.map((group) => group.key)).toEqual([
      "VERDICT:2026-11-25",
      "VERDICT:2026-11-24",
    ]);
    expect(groups[0].items[0].id).toBe("today");
  });

  it("keeps different types on the same day separate", () => {
    const items = [
      notification({ id: "message", type: "MESSAGE" }),
      notification({ id: "verdict", type: "VERDICT" }),
    ];

    const groups = groupNotifications(items);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.type)).toEqual(["MESSAGE", "VERDICT"]);
  });

  it("sorts mixed input into newest-first order", () => {
    const items = [
      notification({ id: "old", createdAt: "2026-11-25T07:00:00.000Z" }),
      notification({ id: "new", createdAt: "2026-11-25T18:00:00.000Z" }),
      notification({
        id: "other-type",
        type: "MESSAGE",
        createdAt: "2026-11-25T12:00:00.000Z",
      }),
    ];

    const groups = groupNotifications(items);

    expect(groups.map((group) => group.type)).toEqual(["VERDICT", "MESSAGE"]);
    expect(groups[0].items.map((item) => item.id)).toEqual(["new", "old"]);
  });

  it("counts unread items only", () => {
    const items = [
      notification({ id: "read", readAt: "2026-11-25T11:00:00.000Z" }),
      notification({ id: "unread-1" }),
      notification({ id: "unread-2" }),
    ];

    expect(groupNotifications(items)[0].unread).toBe(2);
  });

  it("keeps a single item as its own group", () => {
    const groups = groupNotifications([notification({ id: "solo" })]);

    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(1);
    expect(groups[0].unread).toBe(1);
  });
});
