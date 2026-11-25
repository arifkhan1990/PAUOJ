/**
 * Deterministic curriculum order shared by the lesson pager, the track pager
 * and the SQL industry-project board. Pure data: no React or UI imports.
 */

import { LEARNING_MODULES } from "./modules";
import { LEARNING_ROUTE_SLUGS } from "./route-slugs";
import type { LearningModuleDefinition } from "./types";

export type PagerEyebrow = "Previous" | "Next";

export type LessonPagerKind = "overview" | "topic" | "checkpoint";

export type LessonPagerItem = {
  kind: LessonPagerKind;
  href: string;
  eyebrow: PagerEyebrow;
  title: string;
  subtitle?: string;
  meta?: string;
};

export type LessonPagerData = {
  previous: LessonPagerItem;
  next: LessonPagerItem;
  position: number;
  total: number;
  moduleTitle: string;
  backHref: string;
  backLabel: string;
};

export type TrackPagerItem = {
  href: string;
  eyebrow: PagerEyebrow;
  title: string;
  subtitle?: string;
  meta?: string;
};

export type TrackPagerData = {
  previous: TrackPagerItem | null;
  next: TrackPagerItem | null;
  position: number;
  total: number;
};

export type CurriculumTopic = {
  moduleSlug: string;
  topicSlug: string;
  position: number;
};

/** Tracks in curriculum order; the curriculum is authored in order already. */
const ORDERED_MODULES = [...LEARNING_MODULES].sort(
  (a, b) => a.order - b.order,
);

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function topicPagerItem(
  module: LearningModuleDefinition,
  topicIndex: number,
  eyebrow: PagerEyebrow,
): LessonPagerItem {
  const topic = module.topics[topicIndex];
  return {
    kind: "topic",
    href: `/learn/${module.slug}/${topic.slug}`,
    eyebrow,
    title: topic.title,
    subtitle: topic.titleBn,
    meta: `Topic ${pad(topicIndex + 1)} of ${pad(module.topics.length)}`,
  };
}

function overviewPagerItem(
  module: LearningModuleDefinition,
  eyebrow: PagerEyebrow,
  title = "Track overview",
): LessonPagerItem {
  return {
    kind: "overview",
    href: `/learn/${module.slug}`,
    eyebrow,
    title,
    subtitle: module.title,
    meta: `${module.topics.length} topics`,
  };
}

function checkpointPagerItem(
  module: LearningModuleDefinition,
): LessonPagerItem | null {
  const checkpoint = module.checkpoint;
  if (!checkpoint) return null;
  return {
    kind: "checkpoint",
    href: `/learn/${module.slug}#checkpoint`,
    eyebrow: "Next",
    title: checkpoint.title,
    subtitle: checkpoint.titleBn,
    meta: `${checkpoint.durationMinutes} min · ${checkpoint.problemSlugs.length} problems`,
  };
}

function nextPagerItem(
  module: LearningModuleDefinition,
  topicIndex: number,
): LessonPagerItem {
  if (topicIndex < module.topics.length - 1) {
    return topicPagerItem(module, topicIndex + 1, "Next");
  }
  return (
    checkpointPagerItem(module) ??
    overviewPagerItem(module, "Next", "Back to track")
  );
}

export function getLessonPagerData(
  module: LearningModuleDefinition,
  topicSlug: string,
): LessonPagerData | null {
  const index = module.topics.findIndex((topic) => topic.slug === topicSlug);
  if (index === -1) return null;

  const total = module.topics.length;
  const backHref = `/learn/${module.slug}`;

  return {
    previous:
      index === 0
        ? overviewPagerItem(module, "Previous")
        : topicPagerItem(module, index - 1, "Previous"),
    next: nextPagerItem(module, index),
    position: index + 1,
    total,
    moduleTitle: module.title,
    backHref,
    backLabel: module.title,
  };
}

function trackPagerItem(
  module: LearningModuleDefinition,
  eyebrow: PagerEyebrow,
): TrackPagerItem {
  const prefix =
    module.track === "tools" ? "Career toolkit" : `Track ${pad(module.order)}`;
  return {
    href: `/learn/${module.slug}`,
    eyebrow,
    title: module.title,
    subtitle: `${prefix} · ${module.subtitle}`,
    meta: `${module.topics.length} topics · ${module.estimatedHours} h`,
  };
}

export function getTrackPagerData(moduleSlug: string): TrackPagerData | null {
  const index = ORDERED_MODULES.findIndex(
    (module) => module.slug === moduleSlug,
  );
  if (index === -1) return null;

  return {
    previous:
      index > 0 ? trackPagerItem(ORDERED_MODULES[index - 1], "Previous") : null,
    next:
      index < ORDERED_MODULES.length - 1
        ? trackPagerItem(ORDERED_MODULES[index + 1], "Next")
        : null,
    position: index + 1,
    total: ORDERED_MODULES.length,
  };
}

/**
 * Flat lesson order across every track, in curriculum order. Uses the
 * lightweight route index so the SQL dossier board does not load lesson text.
 */
export function getCurriculumTopicSequence(): CurriculumTopic[] {
  const sequence: CurriculumTopic[] = [];
  for (const [moduleSlug, topicSlugs] of Object.entries(LEARNING_ROUTE_SLUGS)) {
    for (const topicSlug of topicSlugs) {
      sequence.push({
        moduleSlug,
        topicSlug,
        position: sequence.length + 1,
      });
    }
  }
  return sequence;
}

export function getCurriculumTopicPosition(
  moduleSlug: string,
  topicSlug: string,
): number | null {
  let offset = 0;
  for (const [slug, topicSlugs] of Object.entries(LEARNING_ROUTE_SLUGS)) {
    if (slug === moduleSlug) {
      const index = topicSlugs.indexOf(topicSlug);
      return index === -1 ? null : offset + index + 1;
    }
    offset += topicSlugs.length;
  }
  return null;
}
