import Link from "next/link";
import { CheckCircle2, CircleDot, Trophy } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { Card } from "@/components/ui/card";
import type { ProfileProblemItem } from "@/lib/profile-types";
import { formatRelative } from "@/lib/utils";

export function ProfileProblems({
  title,
  description,
  items,
  variant,
}: {
  title: string;
  description: string;
  items: ProfileProblemItem[];
  variant: "solved" | "unsolved";
}) {
  const Icon = variant === "solved" ? CheckCircle2 : CircleDot;
  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/20 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <span
          className={
            variant === "solved"
              ? "grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }
        >
          <Icon className="size-4" />
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-8 text-xs text-muted-foreground">
          <Trophy className="size-4 shrink-0" />
          {variant === "solved"
            ? "No accepted solutions yet."
            : "No unsolved attempts on record."}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/problems/${item.slug}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <DifficultyBadge difficulty={item.difficulty} />
                    <span className="font-mono">{item.points} pts</span>
                    <span>
                      {item.attempts}{" "}
                      {item.attempts === 1 ? "submission" : "submissions"}
                    </span>
                    <span>
                      {variant === "solved" ? "solved" : "tried"}{" "}
                      {formatRelative(item.lastActivityAt)}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
