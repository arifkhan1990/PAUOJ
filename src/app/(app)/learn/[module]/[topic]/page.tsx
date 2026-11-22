import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Flag } from "lucide-react";
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
import { getCurrentUser } from "@/server/auth/session";
import { getLearningTopic } from "@/server/services/learning";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LEVELS = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
] as const;

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

export default async function LearningTopicPage({
  params,
}: {
  params: Promise<{ module: string; topic: string }>;
}) {
  const { module: moduleSlug, topic: topicSlug } = await params;
  const definition = getLearningModuleDefinition(moduleSlug);
  if (!definition?.topics.some((item) => item.slug === topicSlug)) notFound();
  const user = await getCurrentUser();
  const topic = await getLearningTopic(moduleSlug, topicSlug, user);
  if (!topic) notFound();

  const checkpoint = definition?.checkpoint ?? null;
  const isPlanned = definition?.status === "PLANNED";
  const complete =
    topic.progress.total > 0 && topic.progress.solved >= topic.progress.total;

  if (topic.locked && definition?.status === "LIVE") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/learn/${moduleSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {definition ? `Back to ${definition.title}` : "Back to track"}
        </Link>
        <header className="mt-4 border-b border-border pb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {topic.title}
          </h1>
          <p lang="bn" className="mt-1 text-base text-muted-foreground">
            {topic.titleBn}
          </p>
        </header>
        <LearningLocked hint={topic.unlockHint} className="mt-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/learn/${moduleSlug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        {definition ? `Back to ${definition.title}` : "Back to track"}
      </Link>

      <header className="mt-4 border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {topic.title}
        </h1>
        <p lang="bn" className="mt-1 text-base text-muted-foreground">
          {topic.titleBn}
        </p>
        <p
          lang="bn"
          className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground"
        >
          {topic.summary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={complete ? "success" : "muted"}>
            {topic.progress.solved} of {topic.progress.total} solved
          </Badge>
          {definition ? (
            <Badge variant="outline">
              Track {String(definition.order).padStart(2, "0")}
            </Badge>
          ) : null}
        </div>
        {topic.progress.total > 0 ? (
          <LearningProgressBar
            solved={topic.progress.solved}
            total={topic.progress.total}
            percent={topic.progress.percent}
            className="mt-4 max-w-sm"
            label={`${topic.title}: ${topic.progress.solved} of ${topic.progress.total} problems solved`}
          />
        ) : null}
      </header>

      <div className="mt-8 space-y-8">
        {isPlanned ? <ContentInProduction /> : null}

        <LearningSection
          step={1}
          title="Concept note"
          description="Read this first; it sets up the mental model for the problems."
        >
          <Card className="p-5">
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
          title="Tiered practice"
          description="Build control by working up from easy to hard."
        >
          <div className="space-y-5">
            {LEVELS.map((level) => (
              <ProblemGroup
                key={level.key}
                title={level.label}
                problems={topic.practice[level.key]}
                emptyText={`${level.label} problems are in production.`}
              />
            ))}
          </div>
        </LearningSection>

        <LearningSection
          step={4}
          title="Extra practice"
          description="Try these without hints before moving on."
        >
          <ProblemGroup
            title="নিজে চেষ্টা করুন"
            problems={topic.extra}
            emptyText="Extra problems are in production."
          />
        </LearningSection>

        {checkpoint ? (
          <LearningSection step={5} title="Checkpoint">
            <Card className="flex flex-col gap-3 border-primary/25 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
                  aria-hidden="true"
                >
                  <Flag className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold">
                    Ready to prove this module?
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {checkpoint.durationMinutes} minutes ·{" "}
                    {checkpoint.problemSlugs.length} problems · earns the{" "}
                    {checkpoint.badge.name} badge
                  </p>
                </div>
              </div>
              <Link
                href={`/learn/${moduleSlug}#checkpoint`}
                className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
              >
                Go to checkpoint
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Card>
          </LearningSection>
        ) : null}
      </div>
    </div>
  );
}
