import Link from "next/link";
import {
  BookMarked,
  BookOpen,
  Clock3,
  HardDrive,
  ListChecks,
  MessageSquare,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ProblemTags } from "@/components/problems/problem-tags";
import { SolveStatus } from "@/components/shared/solve-status";
import { buttonVariants } from "@/components/ui/button";
import {
  problemTabHref,
  type ProblemTab,
} from "@/lib/problem-tabs";
import type { ProblemDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

function TabLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 transition-colors",
          active
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      />
      {children}
    </Link>
  );
}

export function ProblemHeader({
  problem,
  showInsights,
  activeTab,
  action,
}: {
  problem: ProblemDetail;
  showInsights: boolean;
  activeTab: ProblemTab;
  action?: { href: string; label: string } | null;
}) {
  const tab = (value: ProblemTab) => problemTabHref(problem.slug, value);

  return (
    <header className="border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link href="/problems" className="hover:text-primary">
          Problems
        </Link>
        <span>/</span>
        <span className="font-mono">{problem.slug}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={problem.difficulty} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <SolveStatus
            solved={problem.solvedByMe}
            attempted={problem.attemptedByMe}
          />
          {problem.solvedByMe
            ? "Solved"
            : problem.attemptedByMe
              ? "Attempted"
              : "Not attempted"}
        </span>
        {action ? (
          <Link
            href={action.href}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "ml-auto",
            )}
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {problem.title}
      </h1>
      <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-1.5">
          <dt className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" aria-hidden="true" /> Time
          </dt>
          <dd className="font-mono text-foreground">{problem.timeLimitMs} ms</dd>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <dt className="inline-flex items-center gap-1.5">
            <HardDrive className="size-3.5" aria-hidden="true" /> Memory
          </dt>
          <dd className="font-mono text-foreground">
            {problem.memoryLimitMb} MB
          </dd>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <dt className="inline-flex items-center gap-1.5">
            <Sparkles className="size-3.5" aria-hidden="true" /> Points
          </dt>
          <dd className="font-mono text-foreground">{problem.points}</dd>
        </div>
      </dl>
      <ProblemTags tags={problem.tags} limit={8} className="mt-3" />
      <nav
        aria-label="Problem sections"
        className="mt-6 flex flex-wrap items-center gap-x-1 border-b border-border"
      >
        <TabLink
          href={tab("description")}
          active={activeTab === "description"}
          icon={BookOpen}
        >
          Description
        </TabLink>
        {showInsights ? (
          <TabLink
            href={tab("rankboard")}
            active={activeTab === "rankboard"}
            icon={Trophy}
          >
            RankBoard
          </TabLink>
        ) : null}
        <TabLink
          href={tab("submissions")}
          active={activeTab === "submissions"}
          icon={ListChecks}
        >
          Submissions
        </TabLink>
        {showInsights ? (
          <TabLink
            href={tab("discussion")}
            active={activeTab === "discussion"}
            icon={MessageSquare}
          >
            Forum
          </TabLink>
        ) : null}
        <TabLink
          href={tab("editorial")}
          active={activeTab === "editorial"}
          icon={BookMarked}
        >
          Editorial
        </TabLink>
        {showInsights ? (
          <TabLink
            href={tab("resources")}
            active={activeTab === "resources"}
            icon={BookOpen}
          >
            Resources
          </TabLink>
        ) : null}
      </nav>
    </header>
  );
}
