import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCode2,
  Flag,
  ListChecks,
} from "lucide-react";
import { ContentInProduction } from "@/components/learning/content-in-production";
import { LearningLocked } from "@/components/learning/learning-locked";
import { LearningProgressBar } from "@/components/learning/learning-progress";
import { LearningSection } from "@/components/learning/learning-section";
import { ProblemGroup } from "@/components/learning/problem-group";
import { Markdown } from "@/components/shared/markdown";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLearningModule as getLearningModuleDefinition } from "@/lib/learning/modules";
import type {
  LearningCheckpointDefinition,
  LearningModuleDefinition,
  LearningTopicView,
} from "@/lib/learning/types";
import { getCurrentUser } from "@/server/auth/session";
import { getLearningTopic } from "@/server/services/learning";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LEVELS = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
] as const;

const NAV_ITEMS = [
  { id: "concept", label: "Concept note" },
  { id: "guided", label: "Guided practice" },
  { id: "tiered", label: "Tiered practice" },
  { id: "extra", label: "Extra practice" },
] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string; topic: string }>;
}): Promise<Metadata> {
  const { module: moduleSlug, topic: topicSlug } = await params;
  const definition = getLearningModuleDefinition(moduleSlug);
  const topic = definition?.topics.find((item) => item.slug === topicSlug);
  if (!topic) return { title: "Learning topic" };
  return { title: `${topic.title} · Learning tracks`, description: topic.summary };
}

function TopicBreadcrumb({
  moduleSlug,
  moduleOrder,
  moduleTitle,
  topicTitle,
}: {
  moduleSlug: string;
  moduleOrder: number;
  moduleTitle: string;
  topicTitle: string;
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
            Track {pad(moduleOrder)}
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

function TopicHeader({
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
    <header className="border-b border-border pb-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
          Track {pad(definition.order)} · Topic {pad(topicPosition)} of{" "}
          {pad(definition.topics.length)}
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

      <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {topic.title}
      </h1>
      <p lang="bn" className="mt-1.5 text-base text-muted-foreground sm:text-lg">
        {topic.titleBn}
      </p>
      <p lang="bn" className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {topic.summary}
      </p>

      <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <FileCode2 className="size-3.5" aria-hidden="true" />
        {topic.progress.total}{" "}
        {topic.progress.total === 1 ? "problem" : "problems"}
      </p>

      {showProgress ? (
        <LearningProgressBar
          solved={topic.progress.solved}
          total={topic.progress.total}
          percent={topic.progress.percent}
          className="mt-3 max-w-sm"
          label={`${topic.title}: ${topic.progress.solved} of ${topic.progress.total} problems solved`}
        />
      ) : null}
    </header>
  );
}

function LessonNav({ showCheckpoint }: { showCheckpoint: boolean }) {
  const items = [
    ...NAV_ITEMS,
    ...(showCheckpoint ? [{ id: "checkpoint", label: "Checkpoint" }] : []),
  ];

  return (
    <nav aria-label="Lesson sections" className="border-b border-border py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        In this lesson
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CheckpointCta({
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

export default async function LearningTopicPage({
  params,
}: {
  params: Promise<{ module: string; topic: string }>;
}) {
  const { module: moduleSlug, topic: topicSlug } = await params;
  const definition = getLearningModuleDefinition(moduleSlug);
  if (!definition || !definition.topics.some((item) => item.slug === topicSlug)) {
    notFound();
  }

  const user = await getCurrentUser();
  const topic = await getLearningTopic(moduleSlug, topicSlug, user);
  if (!topic) notFound();

  const checkpoint = definition.checkpoint;
  const isPlanned = definition.status === "PLANNED";
  const topicPosition =
    definition.topics.findIndex((item) => item.slug === topicSlug) + 1;

  const breadcrumb = (
    <TopicBreadcrumb
      moduleSlug={moduleSlug}
      moduleOrder={definition.order}
      moduleTitle={definition.title}
      topicTitle={topic.title}
    />
  );

  if (topic.locked && definition.status === "LIVE") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {breadcrumb}
        <div className="mt-4">
          <TopicHeader
            topic={topic}
            definition={definition}
            topicPosition={topicPosition}
            locked
          />
        </div>
        <LearningLocked hint={topic.unlockHint} className="mt-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {breadcrumb}
      <div className="mt-4">
        <TopicHeader
          topic={topic}
          definition={definition}
          topicPosition={topicPosition}
          locked={false}
        />
      </div>

      <LessonNav showCheckpoint={Boolean(checkpoint)} />

      <div className="mt-8">
        {isPlanned ? <ContentInProduction className="mb-8" /> : null}

        <LearningSection
          step={1}
          id="concept"
          title="Concept note"
          description="Read this first; it sets up the mental model for the problems."
        >
          <Card className="p-5 sm:p-6">
            {topic.concept.trim() ? (
              <Markdown lang="bn">{topic.concept}</Markdown>
            ) : (
              <p className="text-sm text-muted-foreground">
                The concept note is in production.
              </p>
            )}
          </Card>
        </LearningSection>

        <LearningSection
          step={2}
          id="guided"
          title="Guided practice"
          description="Warm up with worked, story-driven problems."
        >
          <ProblemGroup
            title="Guided problems"
            problems={topic.guided}
            emptyText="Guided problems are in production."
          />
        </LearningSection>

        <LearningSection
          step={3}
          id="tiered"
          title="Tiered practice"
          description="Build control by working up from easy to hard."
        >
          <div className="space-y-6">
            {LEVELS.map((level) => (
              <ProblemGroup
                key={level.key}
                title={level.label}
                tone={level.key}
                problems={topic.practice[level.key]}
                emptyText={`${level.label} problems are in production.`}
              />
            ))}
          </div>
        </LearningSection>

        <LearningSection
          step={4}
          id="extra"
          title="Extra practice"
          description="Try these without hints before moving on."
          isLast={!checkpoint}
        >
          <ProblemGroup
            title="নিজে চেষ্টা করুন"
            titleLang="bn"
            problems={topic.extra}
            emptyText="Extra problems are in production."
          />
        </LearningSection>

        {checkpoint ? (
          <LearningSection
            step={5}
            id="checkpoint"
            title="Checkpoint"
            description="One timed attempt. Solve every problem to earn the module badge."
            isLast
          >
            <CheckpointCta checkpoint={checkpoint} moduleSlug={moduleSlug} />
          </LearningSection>
        ) : null}
      </div>
    </div>
  );
}
