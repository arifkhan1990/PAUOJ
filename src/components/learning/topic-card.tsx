import Link from "next/link";
import { ArrowUpRight, Check, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LearningTopicView } from "@/lib/learning/types";
import { cn } from "@/lib/utils";
import { LearningProgressBar } from "./learning-progress";

function TopicStatus({
  planned,
  locked,
  complete,
}: {
  planned: boolean;
  locked: boolean;
  complete: boolean;
}) {
  if (planned) return <Badge variant="muted">Planned</Badge>;
  if (locked) {
    return (
      <Badge variant="muted">
        <LockKeyhole className="size-3" aria-hidden="true" />
        Locked
      </Badge>
    );
  }
  if (complete) {
    return (
      <Badge variant="success">
        <Check className="size-3" aria-hidden="true" />
        Solved
      </Badge>
    );
  }
  return null;
}

function TopicProgress({
  topic,
  planned,
  interactive,
}: {
  topic: LearningTopicView;
  planned: boolean;
  interactive: boolean;
}) {
  if (!interactive) {
    return (
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80">
        {planned
          ? "Outline only · concept note and problems are in production"
          : "Locked · earn the previous checkpoint badge to open this topic"}
      </p>
    );
  }

  return (
    <LearningProgressBar
      solved={topic.progress.solved}
      total={topic.progress.total}
      percent={topic.progress.percent}
      className="mt-3"
      label={`${topic.title}: ${topic.progress.solved} of ${topic.progress.total} problems solved`}
    />
  );
}

export function TopicCard({
  topic,
  moduleSlug,
  position,
  planned = false,
  locked = false,
}: {
  topic: LearningTopicView;
  moduleSlug: string;
  position: number;
  planned?: boolean;
  locked?: boolean;
}) {
  const number = String(position).padStart(2, "0");
  const hidden = planned || locked;
  const interactive = !hidden;
  const complete =
    interactive &&
    topic.progress.total > 0 &&
    topic.progress.solved >= topic.progress.total;

  return (
    <li className="group">
      <Card
        className={cn(
          "relative h-full overflow-hidden p-0 transition-colors",
          interactive
            ? "hover:border-primary/45 hover:bg-muted/20 focus-within:border-primary/45"
            : "border-dashed bg-muted/15",
        )}
      >
        <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
          <span
            aria-hidden="true"
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-lg border font-mono text-[11px] font-semibold",
              hidden
                ? "border-border bg-muted text-muted-foreground"
                : "border-primary/20 bg-primary/10 text-primary",
            )}
          >
            {number}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h3
                className={cn(
                  "min-w-0 text-sm font-semibold leading-snug",
                  interactive
                    ? "group-hover:text-primary"
                    : "text-muted-foreground",
                )}
              >
                {topic.title}
              </h3>
              <TopicStatus
                planned={planned}
                locked={locked && !planned}
                complete={complete}
              />
            </div>

            <p lang="bn" className="mt-0.5 text-xs text-muted-foreground">
              {topic.titleBn}
            </p>
            <p
              lang="bn"
              className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground"
            >
              {topic.summary}
            </p>

            <TopicProgress
              topic={topic}
              planned={planned}
              interactive={interactive}
            />
          </div>

          {interactive ? (
            <ArrowUpRight
              className="mt-1 hidden size-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:text-primary sm:block"
              aria-hidden="true"
            />
          ) : null}
        </div>

        {interactive ? (
          <Link
            href={`/learn/${moduleSlug}/${topic.slug}`}
            aria-label={`Open topic ${position}: ${topic.title}${
              complete ? " (solved)" : ""
            }`}
            className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          />
        ) : null}
      </Card>
    </li>
  );
}
