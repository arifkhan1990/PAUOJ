import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckpointCard } from "@/components/learning/checkpoint-card";
import { ContentInProduction } from "@/components/learning/content-in-production";
import { CourseOverview } from "@/components/learning/course-overview";
import { LearningLocked } from "@/components/learning/learning-locked";
import { LearningSteps } from "@/components/learning/learning-steps";
import { ModuleHeader } from "@/components/learning/module-header";
import { ModuleDiagram } from "@/components/learning/module-diagram";
import { PremiumPaywall } from "@/components/learning/premium-paywall";
import { TopicCard } from "@/components/learning/topic-card";
import { LessonVisual } from "@/components/learning/visuals/lesson-visual";
import { SectionHeading } from "@/components/shared/section-heading";
import { getLearningModule as getLearningModuleDefinition } from "@/lib/learning/modules";
import { purchasePriceBdt } from "@/lib/learning/payments";
import { getLessonVisual } from "@/lib/learning/visuals";
import { getCurrentUser } from "@/server/auth/session";
import { getLearningModule } from "@/server/services/learning";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module: moduleSlug } = await params;
  const definition = getLearningModuleDefinition(moduleSlug);
  if (!definition) return { title: "Learning track" };
  return {
    title: `${definition.title} · Learning tracks`,
    description: definition.goal,
  };
}

export default async function LearningModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleSlug } = await params;
  const definition = getLearningModuleDefinition(moduleSlug);
  if (!definition) notFound();
  const user = await getCurrentUser();
  const track = await getLearningModule(moduleSlug, user);
  if (!track) notFound();

  const isLive = track.status === "LIVE";
  const isTools = track.track === "tools";
  const firstTopic = definition.topics[0] ?? null;
  const featuredVisual = firstTopic
    ? getLessonVisual(moduleSlug, firstTopic.slug)
    : null;

  if (track.paywalled && isLive) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <ModuleHeader module={track} />
        <CourseOverview
          module={track}
          isSql={track.track === "sql"}
          className="mt-8"
        />
        <PremiumPaywall
          moduleTitle={track.title}
          priceBdt={purchasePriceBdt(track.slug)}
          className="mt-6"
        />

        {firstTopic && featuredVisual ? (
          <section className="mt-8">
            <SectionHeading
              title="Visual preview"
              description="A small taste of the first lesson's visual explainer."
            />
            <div className="mt-4">
              <LessonVisual config={featuredVisual} compact />
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <SectionHeading
            title="What's inside"
            description="The full curriculum is ready — purchase or request free access to open it."
          />
          <ul role="list" className="mt-4 grid gap-2.5">
            {track.topics.map((topic, index) => (
              <TopicCard
                key={topic.slug}
                topic={topic}
                moduleSlug={track.slug}
                position={index + 1}
                locked
              />
            ))}
          </ul>
        </section>
      </div>
    );
  }

  if (track.locked && isLive) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <ModuleHeader module={track} />
        <CourseOverview
          module={track}
          isSql={track.track === "sql"}
          className="mt-8"
        />
        <LearningLocked hint={track.unlockHint} className="mt-6" />

        {firstTopic && featuredVisual ? (
          <section className="mt-8">
            <SectionHeading
              title="Visual preview"
              description="A small taste of the first lesson's visual explainer."
            />
            <div className="mt-4">
              <LessonVisual config={featuredVisual} compact />
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <SectionHeading
            title="What's inside"
            description="Preview the curriculum now — topics and problems open once the previous checkpoint is cleared."
          />
          <ul role="list" className="mt-4 grid gap-2.5">
            {track.topics.map((topic, index) => (
              <TopicCard
                key={topic.slug}
                topic={topic}
                moduleSlug={track.slug}
                position={index + 1}
                locked
              />
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <ModuleHeader module={track} />

      <CourseOverview
        module={track}
        isSql={track.track === "sql"}
        className="mt-8"
      />

      {isLive ? null : <ContentInProduction className="mt-6" />}

      <section className="mt-10">
        <SectionHeading
          title="How this track works"
          description={
            isTools
              ? "Five steps from the problem story to the timed checkpoint and discussion."
              : "Five steps from the first concept note to the timed checkpoint."
          }
        />
        <LearningSteps
          muted={!isLive}
          variant={isTools ? "workshop" : "track"}
          className="mt-4"
        />
      </section>

      {isLive && definition.diagram ? (
        <section className="mt-10">
          <SectionHeading
            title="Track map"
            description="How the topics in this track connect and build on each other."
          />
          <ModuleDiagram
            src={definition.diagram.src}
            alt={definition.diagram.alt}
            className="mt-4"
          />
        </section>
      ) : null}

      {isLive && firstTopic && featuredVisual ? (
        <section className="mt-10">
          <SectionHeading
            title="Visual-first lessons"
            description="Every topic opens with an animated visual explainer. Here is the first one — open the topic for the full story."
          />
          <div className="mt-4">
            <LessonVisual config={featuredVisual} compact />
          </div>
          <Link
            href={`/learn/${moduleSlug}/${firstTopic.slug}`}
            className="mt-3 inline-flex min-h-11 items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Open topic 1: {firstTopic.title} →
          </Link>
        </section>
      ) : null}

      <section className="mt-10">
        <SectionHeading
          title="Topics"
          description={
            !isLive
              ? "The published outline — concept notes and problem sets are being authored."
              : isTools
                ? "Work through them in order — each topic starts with a story, then guided drills and solo drills."
                : "Work through them in order — each topic has a concept note, guided problems and tiered practice."
          }
        />
        <ul role="list" className="mt-4 grid gap-2.5">
          {track.topics.map((topic, index) => (
            <TopicCard
              key={topic.slug}
              topic={topic}
              moduleSlug={track.slug}
              position={index + 1}
              planned={!isLive}
            />
          ))}
        </ul>
      </section>

      {isLive && track.checkpoint ? (
        <CheckpointCard
          checkpoint={track.checkpoint}
          moduleSlug={track.slug}
          signedIn={Boolean(user)}
          className="mt-10"
        />
      ) : null}
    </div>
  );
}
