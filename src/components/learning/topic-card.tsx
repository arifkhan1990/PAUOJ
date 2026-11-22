import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LearningTopicView } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { LearningProgressBar } from "./learning-progress";

export function TopicCard({
  topic,
  moduleSlug,
  position,
  planned = false,
}: {
  topic: LearningTopicView;
  moduleSlug: string;
  position: number;
  planned?: boolean;
}) {
  const number = String(position).padStart(2, "0");

  return (
    <li className="group relative">
      <Card
        className={cn(
          "relative h-full overflow-hidden p-0 transition-colors",
          planned ? "bg-muted/20" : "hover:border-primary/45",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-0 left-0 w-0.5",
            planned ? "bg-muted-foreground/20" : "bg-primary/70",
          )}
        />
        <div className="flex gap-3 p-4 pl-5">
          <span
            className={cn(
              "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md font-mono text-[11px] font-medium",
              planned
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary",
            )}
            aria-hidden="true"
          >
            {number}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
              <h3 className="text-sm font-semibold leading-snug">
                {topic.title}
              </h3>
              {planned ? (
                <Badge variant="muted">Planned</Badge>
              ) : (
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  {topic.progress.solved}/{topic.progress.total}
                </span>
              )}
            </div>
            <p lang="bn" className="mt-0.5 text-xs text-muted-foreground">
              {topic.titleBn}
            </p>
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {topic.summary}
            </p>
            {planned ? (
              <p className="mt-3 text-[11px] text-muted-foreground/80">
                Outline only · content in production
              </p>
            ) : (
              <LearningProgressBar
                solved={topic.progress.solved}
                total={topic.progress.total}
                percent={topic.progress.percent}
                className="mt-3"
                label={`${topic.title}: ${topic.progress.solved} of ${topic.progress.total} problems solved`}
              />
            )}
          </div>
          {planned ? null : (
            <ArrowUpRight
              className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary"
              aria-hidden="true"
            />
          )}
        </div>
      </Card>
      {planned ? null : (
        <Link
          href={`/learn/${moduleSlug}/${topic.slug}`}
          aria-label={`Open topic ${topic.title}`}
          className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />
      )}
    </li>
  );
}
