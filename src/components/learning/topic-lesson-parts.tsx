import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCode2,
  Flag,
  ListChecks,
  MessageSquareOff,
} from "lucide-react";
import { LessonProgressDonut } from "@/components/learning/lesson-progress-donut";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  LearningCheckpointDefinition,
  LearningModuleDefinition,
  LearningTopicView,
} from "@/lib/learning/types";
import { cn } from "@/lib/utils";

export const LESSON_NAV_ITEMS = [
  { id: "concept", label: "Concept note" },
  { id: "guided", label: "Guided practice" },
  { id: "tiered", label: "Tiered practice" },
  { id: "extra", label: "Extra practice" },
] as const;

export function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function TopicBreadcrumb({
  moduleSlug,
  moduleOrder,
  moduleTitle,
  topicTitle,
  isToolkit = false,
}: {
  moduleSlug: string;
  moduleOrder: number;
  moduleTitle: string;
  topicTitle: string;
  isToolkit?: boolean;
}) {
  const linkClass =
    "rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <li>
          <Link href="/learn" className={linkClass}>
            All tracks
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
        </li>
        <li>
          <Link
            href={`/learn/${moduleSlug}`}
            title={moduleTitle}
            className={linkClass}
          >
            {isToolkit ? "Career toolkit" : `Track ${pad(moduleOrder)}`}
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3.5 text-muted-foreground/60" />
        </li>
        <li aria-current="page" className="min-w-0 font-medium text-foreground">
          <span className="line-clamp-1">{topicTitle}</span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * Compact lesson header. On `lg+` it pins below the sticky site header so the
 * lesson context stays visible while the content and side menu scroll.
 */
export function LessonHeader({
  topic,
  definition,
  topicPosition,
  locked,
}: {
  topic: LearningTopicView;
  definition: LearningModuleDefinition;
  topicPosition: number;
  locked: boolean;
}) {
  const isPlanned = definition.status === "PLANNED";
  const complete =
    topic.progress.total > 0 && topic.progress.solved >= topic.progress.total;
  const showProgress = !locked && !isPlanned && topic.progress.total > 0;

  return (
    <header
      id="lesson-header"
      className="border-b border-border bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85 md:sticky md:top-16 md:z-30"
    >
      <TopicBreadcrumb
        moduleSlug={definition.slug}
        moduleOrder={definition.order}
        moduleTitle={definition.title}
        topicTitle={topic.title}
        isToolkit={definition.track === "tools"}
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {topic.title}
        </h1>
        <p lang="bn" className="text-sm text-muted-foreground">
          {topic.titleBn}
        </p>
        {isPlanned ? (
          <Badge variant="muted">Planned</Badge>
        ) : complete ? (
          <Badge variant="success">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Complete
          </Badge>
        ) : null}
      </div>

      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              Topic {pad(topicPosition)} of {pad(definition.topics.length)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <FileCode2 className="size-3.5" aria-hidden="true" />
              {topic.progress.total}{" "}
              {topic.progress.total === 1 ? "problem" : "problems"}
            </span>
          </div>
        </div>
        {showProgress ? (
          <LessonProgressDonut
            solved={topic.progress.solved}
            total={topic.progress.total}
            percent={topic.progress.percent}
          />
        ) : null}
      </div>
    </header>
  );
}

/** Compact inline section nav used below `lg`, where the fixed aside is hidden. */
export function LessonNav({
  showCheckpoint,
  showDiscussion = true,
  items,
}: {
  showCheckpoint: boolean;
  showDiscussion?: boolean;
  /** Overrides the default track sections, e.g. workshop lessons without tiered sets. */
  items?: { id: string; label: string }[];
}) {
  const navItems =
    items ??
    [
      ...LESSON_NAV_ITEMS,
      ...(showCheckpoint ? [{ id: "checkpoint", label: "Checkpoint" }] : []),
      ...(showDiscussion ? [{ id: "discussion", label: "Discussion" }] : []),
    ];

  return (
    <nav aria-label="Lesson sections" className="border-b border-border py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        In this lesson
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {navItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function CheckpointCta({
  checkpoint,
  moduleSlug,
}: {
  checkpoint: LearningCheckpointDefinition;
  moduleSlug: string;
}) {
  return (
    <Card className="overflow-hidden border-primary/25 bg-primary/[0.04] p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20"
            aria-hidden="true"
          >
            <Flag className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Final checkpoint
            </p>
            <p className="mt-1 text-base font-semibold sm:text-lg">
              Ready to prove this module?
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3.5" aria-hidden="true" />
                {checkpoint.durationMinutes} minutes
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ListChecks className="size-3.5" aria-hidden="true" />
                {checkpoint.problemSlugs.length}{" "}
                {checkpoint.problemSlugs.length === 1 ? "problem" : "problems"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Award className="size-3.5" aria-hidden="true" />
                {checkpoint.badge.name} badge
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/learn/${moduleSlug}#checkpoint`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full shrink-0 sm:w-auto",
          )}
        >
          Go to checkpoint
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}

/** Shown when the social tables are missing because a deploy skipped migrations. */
export function LessonSocialUnavailable() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-5">
      <MessageSquareOff
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-medium">Discussion is being set up</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Reactions and comments become available as soon as the next
          maintenance update is applied. The lesson itself works normally.
        </p>
      </div>
    </div>
  );
}
