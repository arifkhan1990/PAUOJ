import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContentInProduction } from "@/components/learning/content-in-production";
import { LearningLocked } from "@/components/learning/learning-locked";
import { LearningSection } from "@/components/learning/learning-section";
import { ProblemGroup } from "@/components/learning/problem-group";
import { PremiumPaywall } from "@/components/learning/premium-paywall";
import {
  CheckpointCta,
  LessonHeader,
  LessonNav,
  LessonSocialUnavailable,
} from "@/components/learning/topic-lesson-parts";
import { Markdown } from "@/components/shared/markdown";
import { Card } from "@/components/ui/card";
import { LessonToc, type LessonTocItem } from "@/features/learning/lesson-toc";
import { LessonSocial } from "@/features/learning/lesson-social";
import { getLearningModule as getLearningModuleDefinition } from "@/lib/learning/modules";
import {
  extractMarkdownHeadings,
  type LessonOutlineHeading,
} from "@/lib/learning/lesson-outline";
import { getCurrentUser } from "@/server/auth/session";
import { getLearningTopic } from "@/server/services/learning";
import { getLessonSocial } from "@/server/services/lesson-discussions";

export const dynamic = "force-dynamic";

const LEVELS = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
] as const;

/** Nests `###` under the preceding `##` so the concept note reads as a submenu. */
function conceptChildren(headings: LessonOutlineHeading[]): LessonTocItem[] {
  const items: LessonTocItem[] = [];
  for (const heading of headings) {
    const item: LessonTocItem = { id: heading.id, label: heading.label };
    if (heading.level === 3 && items.length > 0) {
      const parent = items[items.length - 1];
      parent.children = [...(parent.children ?? []), item];
      continue;
    }
    items.push(heading.level === 2 ? { ...item, children: [] } : item);
  }
  return items.map((item) =>
    item.children && item.children.length > 0
      ? item
      : { id: item.id, label: item.label },
  );
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
  const [topic, social] = await Promise.all([
    getLearningTopic(moduleSlug, topicSlug, user),
    getLessonSocial(moduleSlug, topicSlug, user),
  ]);
  if (!topic) notFound();

  const checkpoint = definition.checkpoint;
  const isPlanned = definition.status === "PLANNED";
  const topicPosition =
    definition.topics.findIndex((item) => item.slug === topicSlug) + 1;

  if (topic.paywalled && definition.status === "LIVE") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <LessonHeader
          topic={topic}
          definition={definition}
          topicPosition={topicPosition}
          locked={false}
        />
        <PremiumPaywall moduleTitle={definition.title} className="mt-6" />
        <Link
          href={`/learn/${moduleSlug}`}
          className="mt-4 inline-flex text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Back to {definition.title}
        </Link>
      </div>
    );
  }

  if (topic.locked && definition.status === "LIVE") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <LessonHeader
          topic={topic}
          definition={definition}
          topicPosition={topicPosition}
          locked
        />
        <LearningLocked hint={topic.unlockHint} className="mt-6" />
      </div>
    );
  }

  const conceptOutline = conceptChildren(
    extractMarkdownHeadings(topic.concept, "concept"),
  );

  const tocItems: LessonTocItem[] = [
    {
      id: "concept",
      label: "Concept note",
      ...(conceptOutline.length > 0 ? { children: conceptOutline } : {}),
    },
    { id: "guided", label: "Guided practice" },
    {
      id: "tiered",
      label: "Tiered practice",
      children: LEVELS.map((level) => ({
        id: `tiered-${level.key}`,
        label: level.label,
      })),
    },
    { id: "extra", label: "Extra practice" },
    ...(checkpoint ? [{ id: "checkpoint", label: "Checkpoint" }] : []),
    { id: "discussion", label: "Discussion" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <LessonHeader
        topic={topic}
        definition={definition}
        topicPosition={topicPosition}
        locked={false}
      />

      <div className="pt-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Lesson contents">
          <div className="sticky top-[calc(var(--lesson-header-bottom,0px)_+_0.5rem)]">
            <LessonToc items={tocItems} />
            <div className="mt-6 border-t border-border pt-4">
              <Link
                href={`/learn/${moduleSlug}`}
                className="inline-flex items-center gap-1.5 rounded-sm text-[11px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back to track
              </Link>
              <p className="mt-3 font-mono text-[11px] tabular-nums text-muted-foreground">
                {topic.progress.solved}/{topic.progress.total} solved
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 max-w-4xl">
          <p
            lang="bn"
            className="max-w-3xl text-sm leading-relaxed text-muted-foreground"
          >
            {topic.summary}
          </p>

          <div className="lg:hidden">
            <LessonNav showCheckpoint={Boolean(checkpoint)} />
          </div>

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
                  <Markdown lang="bn" headingIdPrefix="concept">
                    {topic.concept}
                  </Markdown>
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
                    id={`tiered-${level.key}`}
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
              >
                <CheckpointCta
                  checkpoint={checkpoint}
                  moduleSlug={moduleSlug}
                />
              </LearningSection>
            ) : null}

            <LearningSection
              step={checkpoint ? 6 : 5}
              id="discussion"
              title="Discussion"
              description="Ask questions, share an approach or leave a study tip for this lesson."
              isLast
            >
              {social ? (
                <LessonSocial
                  moduleSlug={moduleSlug}
                  topicSlug={topicSlug}
                  viewer={
                    user
                      ? {
                          id: user.id,
                          username: user.username,
                          displayName: user.displayName,
                          role: user.role,
                        }
                      : null
                  }
                  reactions={social.reactions}
                  comments={social.comments}
                />
              ) : (
                <LessonSocialUnavailable />
              )}
            </LearningSection>
          </div>
        </div>
      </div>
    </div>
  );
}
