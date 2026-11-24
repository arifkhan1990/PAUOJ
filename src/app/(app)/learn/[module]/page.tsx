import type { Metadata } from "next";
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
import { SectionHeading } from "@/components/shared/section-heading";
import { getLearningModule as getLearningModuleDefinition } from "@/lib/learning/modules";
import { purchasePriceBdt } from "@/lib/learning/payments";
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

  if (track.paywalled && isLive) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <ModuleHeader module={track} />
        <CourseOverview
          module={track}
          isSql={definition.track === "sql"}
          className="mt-8"
        />
        <PremiumPaywall
          moduleTitle={track.title}
          priceBdt={purchasePriceBdt(track.slug)}
          className="mt-6"
        />

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
          isSql={definition.track === "sql"}
          className="mt-8"
        />
        <LearningLocked hint={track.unlockHint} className="mt-6" />

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
        isSql={definition.track === "sql"}
        className="mt-8"
      />

      {isLive ? null : <ContentInProduction className="mt-6" />}

      <section className="mt-10">
        <SectionHeading
          title="How this track works"
          description="Five steps from the first concept note to the timed checkpoint."
        />
        <LearningSteps muted={!isLive} className="mt-4" />
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

      <section className="mt-10">
        <SectionHeading
          title="Topics"
          description={
            isLive
              ? "Work through them in order — each topic has a concept note, guided problems and tiered practice."
              : "The published outline — concept notes and problem sets are being authored."
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
