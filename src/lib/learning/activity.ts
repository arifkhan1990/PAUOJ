import { LEARNING_MODULES } from "./modules";
import type {
  LearningModuleDefinition,
  LearningTopicDefinition,
} from "./types";

/** Days of inactivity that trigger a nudge, from gentle to firm. */
export const LEARNING_REMINDER_THRESHOLDS = [7, 21] as const;

export type LearningReminderThreshold =
  (typeof LEARNING_REMINDER_THRESHOLDS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

function topicProblemSlugs(topic: LearningTopicDefinition): string[] {
  return [
    ...topic.guidedProblemSlugs,
    ...topic.practiceProblemSlugs.easy,
    ...topic.practiceProblemSlugs.medium,
    ...topic.practiceProblemSlugs.hard,
    ...topic.extraProblemSlugs,
  ];
}

/** Every problem a module owns: topic problems plus its checkpoint set. */
export function moduleProblemSlugs(
  module: LearningModuleDefinition,
): string[] {
  return [
    ...new Set([
      ...module.topics.flatMap(topicProblemSlugs),
      ...(module.checkpoint?.problemSlugs ?? []),
    ]),
  ];
}

let liveModuleIndex: Map<string, LearningModuleDefinition> | null = null;

/** Live modules only, in curriculum order, first module wins a shared problem. */
function liveModulesByProblem(): Map<string, LearningModuleDefinition> {
  if (liveModuleIndex) return liveModuleIndex;
  const index = new Map<string, LearningModuleDefinition>();
  for (const entry of [...LEARNING_MODULES].sort((a, b) => a.order - b.order)) {
    if (entry.status !== "LIVE") continue;
    for (const slug of moduleProblemSlugs(entry)) {
      if (!index.has(slug)) index.set(slug, entry);
    }
  }
  liveModuleIndex = index;
  return index;
}

/** The live module that contains this problem, or null when none does. */
export function findModuleForProblemSlug(
  slug: string,
): LearningModuleDefinition | null {
  return liveModulesByProblem().get(slug) ?? null;
}

/** Whole days elapsed since the last activity; future dates clamp to zero. */
export function idleDaysSince(lastActivity: Date, now: Date): number {
  const elapsed = now.getTime() - lastActivity.getTime();
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
  return Math.floor(elapsed / DAY_MS);
}

/** The strongest reminder threshold this many idle days has earned. */
export function selectReminderThreshold(
  idleDays: number,
): LearningReminderThreshold | null {
  if (!Number.isFinite(idleDays)) return null;
  if (idleDays >= 21) return 21;
  if (idleDays >= 7) return 7;
  return null;
}

/** Newest of the given timestamps, ignoring missing ones. */
export function latestActivity(
  dates: ReadonlyArray<Date | null | undefined>,
): Date | null {
  let latest: Date | null = null;
  for (const date of dates) {
    if (!date) continue;
    if (!latest || date.getTime() > latest.getTime()) latest = date;
  }
  return latest;
}
