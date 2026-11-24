import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { getDb } from "@/server/db";
import { learningCheckpointAttempts } from "@/server/db/schema";
import { LEARNING_MODULES } from "@/lib/learning/modules";
import {
  isModuleUnlocked,
  moduleUnlockHint,
} from "@/lib/learning/progress";
import type {
  LearningBadge,
  LearningModuleDefinition,
} from "@/lib/learning/types";

export type ModuleUnlock = {
  locked: boolean;
  unlockHint: string | null;
};

function orderedModules(): LearningModuleDefinition[] {
  return [...LEARNING_MODULES].sort((left, right) => left.order - right.order);
}

export async function loadEarnedBadges(
  userId: string | null,
  moduleSlugs: string[],
): Promise<Set<string>> {
  if (!userId || moduleSlugs.length === 0) return new Set();
  const rows = await getDb()
    .select({ moduleSlug: learningCheckpointAttempts.moduleSlug })
    .from(learningCheckpointAttempts)
    .where(
      and(
        eq(learningCheckpointAttempts.userId, userId),
        isNotNull(learningCheckpointAttempts.completedAt),
        inArray(learningCheckpointAttempts.moduleSlug, moduleSlugs),
      ),
    );
  return new Set(rows.map((row) => row.moduleSlug));
}

export function moduleUnlock(
  definition: LearningModuleDefinition,
  badges: Set<string>,
): ModuleUnlock {
  if (definition.track === "sql" || definition.track === "tools") {
    return { locked: false, unlockHint: null };
  }
  const ordered = orderedModules();
  const index = ordered.findIndex((item) => item.slug === definition.slug);
  const previous = index > 0 ? ordered[index - 1] : null;
  if (!previous) return { locked: false, unlockHint: null };
  const previousBadge = Boolean(
    previous.checkpoint && badges.has(previous.slug),
  );
  const locked = !isModuleUnlocked(definition.order, previousBadge);
  return {
    locked,
    unlockHint: locked
      ? moduleUnlockHint(
          previous.title,
          Boolean(previous.checkpoint),
          previousBadge,
        )
      : null,
  };
}

export async function unlockFor(
  definition: LearningModuleDefinition,
  viewerId: string | null,
): Promise<ModuleUnlock> {
  if (
    definition.track === "sql" ||
    definition.track === "tools" ||
    definition.order <= 1
  ) {
    return { locked: false, unlockHint: null };
  }
  const ordered = orderedModules();
  const index = ordered.findIndex((item) => item.slug === definition.slug);
  const previous = index > 0 ? ordered[index - 1] : null;
  if (!previous) return { locked: false, unlockHint: null };
  const badges = await loadEarnedBadges(viewerId, [previous.slug]);
  return moduleUnlock(definition, badges);
}

export async function getLearningBadges(
  userId: string,
): Promise<LearningBadge[]> {
  const modules = orderedModules();
  const rows = await getDb()
    .select({
      moduleSlug: learningCheckpointAttempts.moduleSlug,
      completedAt: learningCheckpointAttempts.completedAt,
    })
    .from(learningCheckpointAttempts)
    .where(
      and(
        eq(learningCheckpointAttempts.userId, userId),
        isNotNull(learningCheckpointAttempts.completedAt),
      ),
    );
  const earned = new Map(
    rows.map((row) => [row.moduleSlug, row.completedAt] as const),
  );
  return modules
    .filter(
      (definition) =>
        definition.status === "LIVE" && definition.checkpoint !== null,
    )
    .map((definition) => {
      const completedAt = earned.get(definition.slug) ?? null;
      const badge = definition.checkpoint!.badge;
      return {
        moduleSlug: definition.slug,
        moduleOrder: definition.order,
        moduleTitle: definition.title,
        badgeSlug: badge.slug,
        badgeName: badge.name,
        description: badge.description,
        earned: completedAt !== null,
        earnedAt: completedAt?.toISOString() ?? null,
        href: `/learn/${definition.slug}`,
      };
    });
}
