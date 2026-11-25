import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  ClipboardCheck,
  Code2,
  Compass,
  GraduationCap,
  GitPullRequest,
  LayoutDashboard,
  ListChecks,
  Medal,
  MessageSquare,
  NotebookPen,
  Settings,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { UserRole } from "./types";

export type DashboardRole = "ADMIN" | "TEACHER" | "CODER";

export type DashboardBadgeKey = "messages" | "notifications" | "requests";

export type DashboardBadges = Partial<Record<DashboardBadgeKey, number>>;

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Which unread counter, if any, this item displays. */
  badgeKey?: DashboardBadgeKey;
  /** Sanitized unread count attached by `dashboardNav`; absent when zero. */
  badge?: number;
};

export type DashboardNavSection = {
  label: string;
  items: DashboardNavItem[];
};

export function dashboardBadgeNoun(key: DashboardBadgeKey): string {
  if (key === "messages") return "unread message";
  if (key === "notifications") return "unread notification";
  return "pending follow request";
}

function normalizeBadge(value: number | undefined): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const count = Math.trunc(value);
  return count > 0 ? count : undefined;
}

function attachBadges(
  items: DashboardNavItem[],
  badges?: DashboardBadges,
): DashboardNavItem[] {
  if (!badges) return items;
  return items.map((item) => {
    if (!item.badgeKey) return item;
    const badge = normalizeBadge(badges[item.badgeKey]);
    return badge === undefined ? item : { ...item, badge };
  });
}

export function dashboardRoleLabel(role: UserRole): string {
  if (role === "ADMIN") return "Administrator";
  if (role === "TEACHER") return "Teacher";
  return "Coder";
}

export function dashboardNav(
  role: DashboardRole,
  username: string,
  badges?: DashboardBadges,
): DashboardNavSection[] {
  if (role === "ADMIN") {
    return [
      {
        label: "Control room",
        items: [
          {
            href: "/admin",
            label: "Overview",
            icon: LayoutDashboard,
            exact: true,
          },
        ],
      },
      {
        label: "Content",
        items: [
          { href: "/admin/problems", label: "Problems", icon: ListChecks },
          {
            href: "/admin/contributions",
            label: "Contributions",
            icon: GitPullRequest,
          },
          { href: "/admin/reviews", label: "Reviews", icon: ShieldCheck },
          { href: "/admin/lists", label: "Study lists", icon: BookOpen },
          { href: "/admin/contests", label: "Contests", icon: Trophy },
          {
            href: "/admin/assessments",
            label: "Assessments",
            icon: ClipboardCheck,
          },
        ],
      },
      {
        label: "People",
        items: [{ href: "/admin/users", label: "Users", icon: Users }],
      },
      {
        label: "Workspaces",
        items: [
          {
            href: "/teacher",
            label: "Teacher panel",
            icon: GraduationCap,
          },
          {
            href: "/dashboard",
            label: "Coder dashboard",
            icon: Code2,
          },
        ],
      },
    ];
  }

  if (role === "TEACHER") {
    return [
      {
        label: "Teaching workspace",
        items: [
          {
            href: "/teacher",
            label: "Overview",
            icon: LayoutDashboard,
            exact: true,
          },
        ],
      },
      {
        label: "Authoring",
        items: [
          { href: "/teacher/problems", label: "Problems", icon: ListChecks },
          {
            href: "/teacher/contributions",
            label: "Contributions",
            icon: GitPullRequest,
          },
          { href: "/teacher/reviews", label: "Reviews", icon: ShieldCheck },
          { href: "/teacher/contests", label: "Contests", icon: Trophy },
          {
            href: "/teacher/assessments",
            label: "Assessments",
            icon: ClipboardCheck,
          },
        ],
      },
      {
        label: "Students",
        items: [
          { href: "/rank", label: "Ranking", icon: Medal },
          {
            href: "/submissions",
            label: "Submissions",
            icon: NotebookPen,
          },
        ],
      },
      {
        label: "Workspaces",
        items: [
          {
            href: "/dashboard",
            label: "Coder dashboard",
            icon: Code2,
          },
        ],
      },
    ];
  }

  const sections: DashboardNavSection[] = [
    {
      label: "My workspace",
      items: [
        {
          href: "/dashboard",
          label: "Overview",
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      label: "Practice",
      items: [
        { href: "/problems", label: "Problems", icon: ListChecks },
        { href: "/lists", label: "Study plans", icon: BookOpen },
        { href: "/dashboard#daily", label: "Daily challenge", icon: Compass },
      ],
    },
    {
      label: "Compete",
      items: [
        { href: "/contests", label: "Contests", icon: Trophy },
        { href: "/rank", label: "Ranking", icon: Medal },
      ],
    },
    {
      label: "Activity",
      items: [
        {
          href: "/submissions?mine=true",
          label: "My submissions",
          icon: Code2,
        },
        {
          href: "/dashboard/contributions",
          label: "Contributions",
          icon: GitPullRequest,
        },
        { href: "/dashboard/reviews", label: "Reviews", icon: ShieldCheck },
      ],
    },
    {
      label: "Social",
      items: [
        {
          href: "/dashboard/connections",
          label: "Connections",
          icon: Users,
          badgeKey: "requests",
        },
        {
          href: "/dashboard/messages",
          label: "Messages",
          icon: MessageSquare,
          badgeKey: "messages",
        },
        {
          href: "/dashboard/notifications",
          label: "Notifications",
          icon: Bell,
          badgeKey: "notifications",
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          href: `/users/${username}`,
          label: "Public profile",
          icon: UserRound,
        },
        { href: "/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  return sections.map((section) => ({
    ...section,
    items: attachBadges(section.items, badges),
  }));
}

export function dashboardWorkspaceMeta(role: DashboardRole): {
  title: string;
  subtitle: string;
  icon: LucideIcon;
} {
  if (role === "ADMIN") {
    return {
      title: "Admin workspace",
      subtitle: "Control room",
      icon: ShieldCheck,
    };
  }
  if (role === "TEACHER") {
    return {
      title: "Teacher workspace",
      subtitle: "Classes & assessments",
      icon: GraduationCap,
    };
  }
  return {
    title: "Coder workspace",
    subtitle: "Practice & contests",
    icon: Code2,
  };
}
