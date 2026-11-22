import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  Clock3,
  FileCode2,
  Layers3,
  LockKeyhole,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LearningModuleSummary } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { LearningProgressBar } from "./learning-progress";

export function ModuleCard({
  module,
  signedIn,
}: {
  module: LearningModuleSummary;
  signedIn: boolean;
}) {
  const isLive = module.status === "LIVE";
  const trackNumber = String(module.order).padStart(2, "0");

  return (
    <li className="group relative">
      <Card
        className={cn(
          "relative flex h-full flex-col overflow-hidden p-0 transition-colors",
          isLive ? "hover:border-primary/45" : "hover:border-muted-foreground/35",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            isLive ? "bg-primary" : "bg-muted-foreground/25",
          )}
        />
        <div className="flex flex-1 flex-col p-5 pl-6">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
              TRACK {trackNumber}
            </span>
            {isLive ? (
              module.locked ? (
                <Badge variant="muted">
                  <LockKeyhole className="mr-1 size-3" aria-hidden="true" />
                  Locked
                </Badge>
              ) : (
                <Badge variant="success">Live</Badge>
              )
            ) : (
              <Badge variant="muted">Planned</Badge>
            )}
          </div>

          <h3 className="mt-3 text-base font-semibold leading-snug">
            {module.title}
          </h3>
          <p lang="bn" className="mt-1 text-sm text-muted-foreground">
            {module.subtitle}
          </p>
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {module.goal}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Layers3 className="size-3.5" aria-hidden="true" />
              {module.topicCount} topics
            </span>
            <span className="inline-flex items-center gap-1">
              <FileCode2 className="size-3.5" aria-hidden="true" />
              {module.problemCount} problems
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {module.estimatedHours} h
            </span>
          </div>

          <div className="mt-auto pt-4">
            {isLive ? (
              <LearningProgressBar
                solved={module.progress.solved}
                total={module.progress.total}
                percent={module.progress.percent}
                muted={!signedIn || module.locked}
                label={`${module.title}: ${module.progress.solved} of ${module.progress.total} problems solved`}
              />
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Roadmap · content in production
              </p>
            )}
            {module.locked && module.unlockHint ? (
              <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                {module.unlockHint}
              </p>
            ) : null}

            <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px]">
              <Award
                className={cn(
                  "size-3.5",
                  module.badgeEarned
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground/60",
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "truncate",
                  module.badgeEarned
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {module.badgeEarned
                  ? "Badge earned"
                  : isLive
                    ? "Badge locked"
                    : "Badge with launch"}
              </span>
              <ArrowUpRight
                className="ml-auto size-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </Card>
      <Link
        href={`/learn/${module.slug}`}
        aria-label={`Open ${module.title} track`}
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      />
    </li>
  );
}
