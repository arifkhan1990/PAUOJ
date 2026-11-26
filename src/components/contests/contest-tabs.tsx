import Link from "next/link";
import {
  Info,
  ListChecks,
  MessageSquare,
  Send,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const CONTEST_TABS = [
  "about",
  "problems",
  "standings",
  "submissions",
  "clarifications",
] as const;

export type ContestTab = (typeof CONTEST_TABS)[number];

const tabs: {
  value: ContestTab;
  label: string;
  icon: LucideIcon;
  path: (slug: string) => string;
}[] = [
  {
    value: "about",
    label: "About",
    icon: Info,
    path: (slug) => `/contests/${slug}`,
  },
  {
    value: "problems",
    label: "Problems",
    icon: ListChecks,
    path: (slug) => `/contests/${slug}?tab=problems`,
  },
  {
    value: "standings",
    label: "RankBoard",
    icon: Trophy,
    path: (slug) => `/contests/${slug}/standings`,
  },
  {
    value: "submissions",
    label: "Submissions",
    icon: Send,
    path: (slug) => `/contests/${slug}/submissions`,
  },
  {
    value: "clarifications",
    label: "Clarifications",
    icon: MessageSquare,
    path: (slug) => `/contests/${slug}/clarifications`,
  },
];

export function ContestTabs({
  slug,
  active,
  className,
}: {
  slug: string;
  active: ContestTab;
  className?: string;
}) {
  return (
    <nav
      aria-label="Contest sections"
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-border pb-2 text-sm",
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.value;
        return (
          <Link
            key={tab.value}
            href={tab.path(slug)}
            prefetch={false}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 transition-colors",
              isActive
                ? "bg-primary/10 font-semibold text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
