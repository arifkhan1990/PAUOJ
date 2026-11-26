import {
  AlarmClock,
  Award,
  Bell,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FilePenLine,
  GraduationCap,
  Medal,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  UserRoundPlus,
} from "lucide-react";
import type { NotificationType } from "@/lib/notification-types";

export type NotificationTypeMeta = {
  icon: typeof Bell;
  className: string;
};

/**
 * Single source of truth for notification icon tiles. The dashboard
 * notifications page and the navbar drawer both render from this map so icons
 * and colours cannot drift.
 */
export const NOTIFICATION_TYPE_META: Record<
  NotificationType,
  NotificationTypeMeta
> = {
  VERDICT: {
    icon: CheckCircle2,
    className: "bg-primary/10 text-primary",
  },
  CONTEST_START: {
    icon: Trophy,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  CONTEST_REGISTRATION: {
    icon: CalendarCheck,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  CONTEST_REMINDER: {
    icon: AlarmClock,
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  CONTEST_RESULT: {
    icon: Award,
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
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
  FOLLOW: {
    icon: UserPlus,
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  FOLLOW_REQUEST: {
    icon: UserRoundPlus,
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  FOLLOW_ACCEPTED: {
    icon: UserCheck,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  MESSAGE: {
    icon: MessageSquare,
    className: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  DISCUSSION: {
    icon: MessagesSquare,
    className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  WELCOME: {
    icon: Sparkles,
    className: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  },
  LEARNING_ENROLLMENT: {
    icon: GraduationCap,
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  LEARNING_PAYMENT: {
    icon: CreditCard,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  LEARNING_REMINDER: {
    icon: CalendarClock,
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  ACHIEVEMENT: {
    icon: Medal,
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  MILESTONE: {
    icon: TrendingUp,
    className: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
  },
  ANNOUNCEMENT: {
    icon: Megaphone,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  MARKETING: {
    icon: Rocket,
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  SYSTEM: {
    icon: Bell,
    className: "bg-muted text-muted-foreground",
  },
};

export type NotificationChip = "Notice" | "News" | "Contest";

/**
 * Short category chip shown next to the title in the drawer. Announcements and
 * system notices read as "Notice", product news as "News", and every contest
 * update as "Contest" so public-facing updates are easy to spot.
 */
export function notificationChipLabel(
  type: NotificationType,
): NotificationChip | null {
  if (type === "ANNOUNCEMENT" || type === "SYSTEM") return "Notice";
  if (type === "MARKETING") return "News";
  if (type.startsWith("CONTEST_")) return "Contest";
  return null;
}
