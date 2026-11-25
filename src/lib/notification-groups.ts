import type { NotificationItem, NotificationType } from "@/lib/notification-types";

export type NotificationGroup = {
  /** Stable React key: type + UTC calendar day. */
  key: string;
  type: NotificationType;
  label: string;
  items: NotificationItem[];
  unread: number;
  latestAt: string;
};

export const NOTIFICATION_GROUP_LABELS: Record<NotificationType, string> = {
  VERDICT: "Verdicts",
  CONTEST_START: "Contest updates",
  CONTEST_REGISTRATION: "Contest updates",
  CONTEST_REMINDER: "Contest updates",
  CONTEST_RESULT: "Contest updates",
  CONTEST_APPROVAL: "Contest updates",
  CLARIFICATION: "Clarifications",
  CONTRIBUTION: "Contribution updates",
  FOLLOW: "Follow activity",
  FOLLOW_REQUEST: "Follow activity",
  FOLLOW_ACCEPTED: "Follow activity",
  MESSAGE: "Messages",
  DISCUSSION: "Discussions",
  WELCOME: "Welcome",
  LEARNING_ENROLLMENT: "Learning updates",
  LEARNING_PAYMENT: "Learning updates",
  LEARNING_REMINDER: "Learning updates",
  ACHIEVEMENT: "Achievements",
  MILESTONE: "Achievements",
  ANNOUNCEMENT: "Announcements",
  MARKETING: "Product news",
  SYSTEM: "System alerts",
};

/** UTC calendar day key, e.g. "2026-11-25". */
export function utcDayKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown-day";
  return date.toISOString().slice(0, 10);
}

function time(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Collapse notifications into type + UTC-day groups.
 *
 * Input rows are expected newest-first; this is enforced by sorting a copy so
 * the output stays newest-first even if a caller passes mixed order. Group
 * order follows each group's newest item.
 */
export function groupNotifications(
  items: NotificationItem[],
): NotificationGroup[] {
  const rows = [...items].sort((a, b) => time(b.createdAt) - time(a.createdAt));
  const groups = new Map<string, NotificationGroup>();

  for (const item of rows) {
    const day = utcDayKey(item.createdAt);
    const key = `${item.type}:${day}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
      if (!item.readAt) existing.unread += 1;
      continue;
    }
    groups.set(key, {
      key,
      type: item.type,
      label: NOTIFICATION_GROUP_LABELS[item.type],
      items: [item],
      unread: item.readAt ? 0 : 1,
      latestAt: item.createdAt,
    });
  }

  return [...groups.values()];
}
