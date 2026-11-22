import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckpointCard } from "@/components/learning/checkpoint-card";
import { ContentInProduction } from "@/components/learning/content-in-production";
import { LearningLocked } from "@/components/learning/learning-locked";
import { LearningSteps } from "@/components/learning/learning-steps";
import { ModuleDiagram } from "@/components/learning/module-diagram";
import { ModuleHeader } from "@/components/learning/module-header";
import { TopicCard } from "@/components/learning/topic-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { getLearningModule as getLearningModuleDefinition } from "@/lib/learning/modules";
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

  if (track.locked && isLive) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <ModuleHeader module={track} />
        <LearningLocked hint={track.unlockHint} className="mt-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <ModuleHeader module={track} />

      {track.description ? (
        <p
          lang="bn"
          className="mt-4 border-l-2 border-primary/25 pl-4 text-sm leading-relaxed text-muted-foreground"
        >
          {track.description}
        </p>
      ) : null}

      {isLive && definition.diagram ? (
        <ModuleDiagram
          src={definition.diagram.src}
          alt={definition.diagram.alt}
          className="mt-6"
        />
      ) : null}

      <LearningSteps muted={!isLive} className="mt-6" />

      {isLive ? null : <ContentInProduction className="mt-4" />}

      <section className="mt-8">
        <SectionHeading
          title="Topics"
          description={
            isLive
              ? "Read the concept note, then work through the guided and tiered practice sets."
              : "The published outline for this track."
          }
        />
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
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
          className="mt-8"
        />
      ) : null}
    </div>
  );
}
