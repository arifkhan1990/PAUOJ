"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Database,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PROJECT_BRIEF,
  PROJECT_TABLES,
} from "@/lib/sql-lab/project";
import {
  SQL_LAB_TASKS,
  isTaskUnlocked,
  type SqlLabTask,
} from "@/lib/sql-lab/tasks";
import { cn } from "@/lib/utils";

function TaskItem({
  task,
  active,
  completed,
  locked,
  onSelect,
}: {
  task: SqlLabTask;
  active: boolean;
  completed: boolean;
  locked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      aria-current={active ? "true" : undefined}
      className={cn(
        "w-full rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/40 bg-primary/5"
          : "border-transparent hover:bg-muted/50",
        locked && "cursor-not-allowed opacity-60",
      )}
    >
      <span className="flex items-center gap-2 text-xs font-medium">
        {locked ? (
          <LockKeyhole
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        ) : completed ? (
          <CheckCircle2
            className="size-3.5 shrink-0 text-emerald-500"
            aria-hidden="true"
          />
        ) : (
          <span
            className="size-1.5 shrink-0 rounded-full bg-primary/60"
            aria-hidden="true"
          />
        )}
        <span className="line-clamp-1">{task.title}</span>
      </span>
      <span className="mt-1 block text-[10px] text-muted-foreground">
        {task.feature}
      </span>
    </button>
  );
}

export function SqlLabSidebar({
  activeId,
  completed,
  advancedUnlocked,
  onSelect,
}: {
  activeId: string;
  completed: Set<string>;
  advancedUnlocked: boolean;
  onSelect: (task: SqlLabTask) => void;
}) {
  return (
    <aside className="space-y-4">
      <Card className="p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Project
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
          <Database className="size-4 text-primary" aria-hidden="true" />
          {PROJECT_BRIEF.title}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {PROJECT_BRIEF.summary}
        </p>
        <details className="mt-3 border-t border-border pt-3">
          <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <ChevronDown className="size-3.5" aria-hidden="true" />
            Schema ({PROJECT_TABLES.length} tables)
          </summary>
          <ul className="mt-2 space-y-2">
            {PROJECT_TABLES.map((table) => (
              <li key={table.name}>
                <p className="font-mono text-[11px] font-semibold">
                  {table.name}
                </p>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  {table.columns}
                </p>
              </li>
            ))}
          </ul>
        </details>
      </Card>

      <Card className="p-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tasks
          </p>
          <span className="font-mono text-[10px] text-muted-foreground">
            {completed.size}/{SQL_LAB_TASKS.length}
          </span>
        </div>
        <div className="space-y-3">
          {(["basic", "advanced"] as const).map((level) => (
            <div key={level}>
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {level === "basic" ? "Basic · free" : "Advanced · ৳500"}
              </p>
              <div className="space-y-0.5">
                {SQL_LAB_TASKS.filter((item) => item.level === level).map(
                  (item) => (
                    <TaskItem
                      key={item.id}
                      task={item}
                      active={item.id === activeId}
                      completed={completed.has(item.id)}
                      locked={!isTaskUnlocked(item, advancedUnlocked)}
                      onSelect={() => onSelect(item)}
                    />
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {!advancedUnlocked ? (
        <Card className="border-amber-500/30 bg-amber-500/[0.04] p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="size-3.5 text-amber-500" aria-hidden="true" />
            Unlock advanced SQL
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Window functions, retention and revenue timelines — all three
            advanced tasks for ৳500.
          </p>
          <Link
            href="/learn/pricing"
            className={`${buttonVariants({ size: "sm" })} mt-3 w-full`}
          >
            Unlock for ৳500
          </Link>
        </Card>
      ) : (
        <Badge variant="success" className="w-full justify-center py-1.5">
          Advanced SQL unlocked
        </Badge>
      )}
    </aside>
  );
}
