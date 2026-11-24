import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContentInProduction } from "@/components/learning/content-in-production";
import { LearningLocked } from "@/components/learning/learning-locked";
import { LearningSection } from "@/components/learning/learning-section";
import { ProblemGroup } from "@/components/learning/problem-group";
import { PremiumPaywall } from "@/components/learning/premium-paywall";
import { SqlTopicStory } from "@/components/learning/sql-topic-story";
import { LessonVisual } from "@/components/learning/visuals/lesson-visual";
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
import { purchasePriceBdt } from "@/lib/learning/payments";
import { getLessonVisual } from "@/lib/learning/visuals";
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
        <PremiumPaywall
          moduleTitle={definition.title}
          priceBdt={purchasePriceBdt(definition.slug)}
          className="mt-6"
        />
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

  const isTools = definition.track === "tools";
  const isSql = definition.track === "sql";
  const visual = getLessonVisual(moduleSlug, topicSlug);
  const labels = isTools
    ? {
        concept: "Story & concept",
        visual: "Visual story",
        guided: "Guided drills",
        tiered: "Tiered practice",
        extra: "Solo drills",
      }
    : {
        concept: "Concept note",
        visual: "Visual explainer",
        guided: "Guided practice",
        tiered: "Tiered practice",
        extra: "Extra practice",
      };
  // Toolkit topics have no tiered sets; hide empty groups instead of showing
  // "in production" placeholders. Other tracks keep their existing behavior.
  const showGuided = !isTools || topic.guided.length > 0;
  const hasTiered = LEVELS.some(
    (level) => topic.practice[level.key].length > 0,
  );
  const hasExtra = topic.extra.length > 0;
  const sectionOrder = [
    "concept",
    ...(visual ? ["visual"] : []),
    ...(showGuided ? ["guided"] : []),
    ...(hasTiered ? ["tiered"] : []),
    ...(hasExtra ? ["extra"] : []),
    ...(checkpoint ? ["checkpoint"] : []),
    "discussion",
  ];
  const stepOf = (id: string) => sectionOrder.indexOf(id) + 1;

  const tocItems: LessonTocItem[] = [
    {
      id: "concept",
      label: labels.concept,
      ...(conceptOutline.length > 0 ? { children: conceptOutline } : {}),
    },
    ...(visual ? [{ id: "visual", label: labels.visual }] : []),
    ...(showGuided ? [{ id: "guided", label: labels.guided }] : []),
    ...(hasTiered
      ? [
          {
            id: "tiered",
            label: labels.tiered,
            children: LEVELS.map((level) => ({
              id: `tiered-${level.key}`,
              label: level.label,
            })),
          },
        ]
      : []),
    ...(hasExtra ? [{ id: "extra", label: labels.extra }] : []),
    ...(checkpoint ? [{ id: "checkpoint", label: "Checkpoint" }] : []),
    { id: "discussion", label: "Discussion" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
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
            <LessonNav
              showCheckpoint={Boolean(checkpoint)}
              items={tocItems.map(({ id, label }) => ({ id, label }))}
            />
          </div>

          <div className="mt-8">
            {isPlanned ? <ContentInProduction className="mb-8" /> : null}

            <LearningSection
              step={stepOf("concept")}
              id="concept"
              title={labels.concept}
              description={
                isTools
                  ? "Start with the situation, then the idea that makes the tools click."
                  : "Read this first; it sets up the mental model for the problems."
              }
            >
              {isSql && !isPlanned ? (
                <SqlTopicStory topicSlug={topicSlug} className="mb-4" />
              ) : null}
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

            {visual ? (
              <LearningSection
                step={stepOf("visual")}
                id="visual"
                title={labels.visual}
                description="See the mental model first — the animation and the steps below it say the same thing."
              >
                <LessonVisual config={visual} />
              </LearningSection>
            ) : null}

            {showGuided ? (
              <LearningSection
                step={stepOf("guided")}
                id="guided"
                title={labels.guided}
                description={
                  isTools
                    ? "Follow the walkthrough with the solution in view."
                    : "Warm up with worked, story-driven problems."
                }
              >
                <ProblemGroup
                  title={isTools ? "Worked examples" : "Guided problems"}
                  problems={topic.guided}
                  emptyText="Guided problems are in production."
                />
              </LearningSection>
            ) : null}

            {hasTiered ? (
              <LearningSection
                step={stepOf("tiered")}
                id="tiered"
                title={labels.tiered}
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
            ) : null}

            {hasExtra ? (
              <LearningSection
                step={stepOf("extra")}
                id="extra"
                title={labels.extra}
                description={
                  isTools
                    ? "Now repeat the workflow on your own."
                    : "Try these without hints before moving on."
                }
              >
                <ProblemGroup
                  title={isTools ? "Independent set" : "নিজে চেষ্টা করুন"}
                  titleLang={isTools ? undefined : "bn"}
                  problems={topic.extra}
                  emptyText="Extra problems are in production."
                />
              </LearningSection>
            ) : null}

            {checkpoint ? (
              <LearningSection
                step={stepOf("checkpoint")}
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
              step={stepOf("discussion")}
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
