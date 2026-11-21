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
  NotebookPen,
  Settings,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { UserRole } from "./types";

export type DashboardRole = "ADMIN" | "TEACHER" | "CODER";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type DashboardNavSection = {
  label: string;
  items: DashboardNavItem[];
};

export function dashboardRoleLabel(role: UserRole): string {
  if (role === "ADMIN") return "Administrator";
  if (role === "TEACHER") return "Teacher";
  return "Coder";
}

export function dashboardNav(
  role: DashboardRole,
  username: string,
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

  return [
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
        { href: "/notifications", label: "Notifications", icon: Bell },
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
