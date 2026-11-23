import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  learningCheckpointAttempts,
  problems,
  submissions,
} from "@/server/db/schema";
import {
  LEARNING_MODULES,
  getLearningModule as findLearningModule,
  getLearningTopic as findLearningTopic,
} from "@/lib/learning/modules";
import { isPaidModule } from "@/lib/learning/payments";
import type { SafeUser } from "@/server/auth/session";
import { getEntitledModuleSlugs } from "@/server/services/learning-payments";
import {
  buildLearningCheckpointView,
  buildLearningTopicView,
  checkpointStatus,
  isCheckpointComplete,
  progressForProblemViews,
  toLearningProblemViews,
  type CheckpointAttemptTiming,
  type LearningProblemRow,
  type LearningSolvedFlags,
} from "@/lib/learning/progress";
import type {
  LearningCheckpointDefinition,
  LearningCheckpointStart,
  LearningModuleDefinition,
  LearningModuleSummary,
  LearningModuleView,
  LearningTopicDefinition,
  LearningTopicView,
} from "@/lib/learning/types";
import { loadProblems, loadSolvedFlags } from "./learning-data";
import {
  loadEarnedBadges,
  moduleUnlock,
  unlockFor,
} from "./learning-access";

export type LearningViewer = {
  id: string;
  role: "USER" | "TEACHER" | "ADMIN";
} | null;

type CheckpointAttemptRow = CheckpointAttemptTiming & {
  id: string;
  userId: string;
};

function topicProblemSlugs(topic: LearningTopicDefinition): string[] {
  return [
    ...topic.guidedProblemSlugs,
    ...topic.practiceProblemSlugs.easy,
    ...topic.practiceProblemSlugs.medium,
    ...topic.practiceProblemSlugs.hard,
    ...topic.extraProblemSlugs,
  ];
}

function moduleTopicProblemSlugs(definition: LearningModuleDefinition): string[] {
  return [...new Set(definition.topics.flatMap(topicProblemSlugs))];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
function summarizeModule(
  definition: LearningModuleDefinition,
  rows: Map<string, LearningProblemRow>,
  flags: LearningSolvedFlags,
  badges: Set<string>,
): LearningModuleSummary {
  const slugs =
    definition.status === "LIVE" ? moduleTopicProblemSlugs(definition) : [];
  const views = toLearningProblemViews(slugs, rows, flags);
  return {
    slug: definition.slug,
    order: definition.order,
    title: definition.title,
    subtitle: definition.subtitle,
    goal: definition.goal,
    status: definition.status,
    estimatedHours: definition.estimatedHours,
    topicCount: definition.topics.length,
    problemCount: views.length,
    progress: progressForProblemViews(views),
    badgeEarned: badges.has(definition.slug),
    locked: false,
    unlockHint: null,
  };
}

export async function getLearningOverview(
  viewer: LearningViewer,
): Promise<LearningModuleSummary[]> {
  const modules = [...LEARNING_MODULES].sort((a, b) => a.order - b.order);
  const allSlugs = unique(modules.flatMap(moduleTopicProblemSlugs));
  const moduleSlugs = modules.map((definition) => definition.slug);
  const [rows, flags, badges, entitled] = await Promise.all([
    loadProblems(allSlugs),
    loadSolvedFlags(viewer?.id ?? null, allSlugs),
    loadEarnedBadges(viewer?.id ?? null, moduleSlugs),
    getEntitledModuleSlugs(viewer?.id ?? null, viewer?.role),
  ]);
  return modules.map((definition) => {
    const unlockedByPurchase = entitled.has(definition.slug);
    const paywalled = isPaidModule(definition.slug) && !unlockedByPurchase;
    return {
      ...summarizeModule(definition, rows, flags, badges),
      ...(paywalled || unlockedByPurchase
        ? { locked: false, unlockHint: null }
        : moduleUnlock(definition, badges)),
      paywalled,
    };
  });
}

async function findAttempt(
  userId: string,
  moduleSlug: string,
): Promise<CheckpointAttemptRow | null> {
  const [row] = await getDb()
    .select({
      id: learningCheckpointAttempts.id,
      userId: learningCheckpointAttempts.userId,
      startedAt: learningCheckpointAttempts.startedAt,
      endsAt: learningCheckpointAttempts.endsAt,
      completedAt: learningCheckpointAttempts.completedAt,
    })
    .from(learningCheckpointAttempts)
    .where(
      and(
        eq(learningCheckpointAttempts.userId, userId),
        eq(learningCheckpointAttempts.moduleSlug, moduleSlug),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function loadInWindowSolved(
  attempt: CheckpointAttemptRow,
  problemSlugs: string[],
): Promise<Set<string>> {
  if (problemSlugs.length === 0) return new Set();
  const rows = await getDb()
    .selectDistinct({ slug: problems.slug })
    .from(submissions)
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .where(
      and(
        eq(submissions.userId, attempt.userId),
        eq(submissions.status, "ACCEPTED"),
        isNull(submissions.assessmentId),
        inArray(problems.slug, problemSlugs),
        gte(submissions.createdAt, attempt.startedAt),
        lte(submissions.createdAt, attempt.endsAt),
      ),
    );
  return new Set(rows.map((row) => row.slug));
}

async function completeAttemptIfSolved(
  attempt: CheckpointAttemptRow,
  checkpoint: LearningCheckpointDefinition,
  solved: Set<string>,
  now: Date,
): Promise<CheckpointAttemptRow> {
  const status = checkpointStatus(now, attempt);
  if (status !== "ACTIVE" && status !== "EXPIRED") return attempt;
  if (!isCheckpointComplete(solved, checkpoint.problemSlugs)) return attempt;
  const [updated] = await getDb()
    .update(learningCheckpointAttempts)
    .set({ completedAt: now, updatedAt: now })
    .where(
      and(
        eq(learningCheckpointAttempts.id, attempt.id),
        isNull(learningCheckpointAttempts.completedAt),
      ),
    )
    .returning({ completedAt: learningCheckpointAttempts.completedAt });
  return { ...attempt, completedAt: updated?.completedAt ?? now };
}

async function resolveCheckpointAttempt(
  userId: string | null,
  definition: LearningModuleDefinition,
  now: Date,
): Promise<{
  attempt: CheckpointAttemptRow;
  windowSolved: Set<string>;
} | null> {
  if (!userId || !definition.checkpoint) return null;
  const attempt = await findAttempt(userId, definition.slug);
  if (!attempt) return null;
  const windowSolved = await loadInWindowSolved(
    attempt,
    definition.checkpoint.problemSlugs,
  );
  const resolved = await completeAttemptIfSolved(
    attempt,
    definition.checkpoint,
    windowSolved,
    now,
  );
  return { attempt: resolved, windowSolved };
}

export async function getLearningModule(
  moduleSlug: string,
  viewer: LearningViewer,
): Promise<LearningModuleView | null> {
  const definition = findLearningModule(moduleSlug);
  if (!definition) return null;
  const now = new Date();
  const checkpoint =
    definition.status === "LIVE" ? definition.checkpoint : null;
  const allSlugs = unique([
    ...moduleTopicProblemSlugs(definition),
    ...(checkpoint?.problemSlugs ?? []),
  ]);
  const [rows, flags, resolved, entitlements] = await Promise.all([
    loadProblems(allSlugs),
    loadSolvedFlags(viewer?.id ?? null, allSlugs),
    resolveCheckpointAttempt(viewer?.id ?? null, definition, now),
    getEntitledModuleSlugs(viewer?.id ?? null, viewer?.role),
  ]);
  const unlockedByPurchase = entitlements.has(definition.slug);
  const paywalled = isPaidModule(definition.slug) && !unlockedByPurchase;
  const unlock = paywalled || unlockedByPurchase
    ? { locked: false, unlockHint: null }
    : await unlockFor(definition, viewer?.id ?? null);
  const attempt = resolved?.attempt ?? null;
  const topics = definition.topics.map((topic) => ({
    ...buildLearningTopicView(topic, rows, flags),
    ...unlock,
  }));
  const topicViews = topics.flatMap((topic) => [
    ...topic.guided,
    ...topic.practice.easy,
    ...topic.practice.medium,
    ...topic.practice.hard,
    ...topic.extra,
  ]);
  const progress = progressForProblemViews(topicViews);
  return {
    slug: definition.slug,
    order: definition.order,
    title: definition.title,
    subtitle: definition.subtitle,
    goal: definition.goal,
    description: definition.description,
    status: definition.status,
    estimatedHours: definition.estimatedHours,
    problemCount: progress.total,
    progress,
    badgeEarned: attempt?.completedAt != null,
    locked: unlock.locked,
    unlockHint: unlock.unlockHint,
    paywalled,
    topics,
    checkpoint: checkpoint
      ? buildLearningCheckpointView(
          checkpoint,
          attempt,
          rows,
          flags,
          now,
          resolved?.windowSolved,
        )
      : null,
  };
}

export async function getLearningTopic(
  moduleSlug: string,
  topicSlug: string,
  viewer: LearningViewer,
): Promise<LearningTopicView | null> {
  const found = findLearningTopic(moduleSlug, topicSlug);
  if (!found) return null;
  const slugs = unique(topicProblemSlugs(found.topic));
  const [rows, flags, entitlements] = await Promise.all([
    loadProblems(slugs),
    loadSolvedFlags(viewer?.id ?? null, slugs),
    getEntitledModuleSlugs(viewer?.id ?? null, viewer?.role),
  ]);
  const unlockedByPurchase = entitlements.has(found.module.slug);
  const paywalled = isPaidModule(found.module.slug) && !unlockedByPurchase;
  const unlock = paywalled || unlockedByPurchase
    ? { locked: false, unlockHint: null }
    : await unlockFor(found.module, viewer?.id ?? null);
  const base = buildLearningTopicView(found.topic, rows, flags);
  if (paywalled) {
    return {
      ...base,
      concept: "",
      guided: [],
      practice: { easy: [], medium: [], hard: [] },
      extra: [],
      ...unlock,
      paywalled,
    };
  }
  return { ...base, ...unlock, paywalled };
}

function toStartResult(
  moduleSlug: string,
  startedAt: Date,
  endsAt: Date,
  now: Date,
): LearningCheckpointStart {
  return {
    moduleSlug,
    startedAt: startedAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status: checkpointStatus(now, { startedAt, endsAt, completedAt: null }),
  };
}

export async function startLearningCheckpoint(
  moduleSlug: string,
  user: Pick<SafeUser, "id" | "role">,
): Promise<LearningCheckpointStart> {
  const userId = user.id;
  const definition = findLearningModule(moduleSlug);
  if (!definition) throw errors.notFound("Learning module not found.");
  if (definition.status !== "LIVE" || !definition.checkpoint) {
    throw errors.conflict("This module's checkpoint is not available yet.");
  }
  if (isPaidModule(definition.slug) && user.role !== "ADMIN") {
    const entitled = await getEntitledModuleSlugs(user.id, user.role);
    if (!entitled.has(definition.slug)) {
      throw errors.forbidden(
        "This module requires a purchase. Buy it from the learning pricing page.",
      );
    }
  }
  const entitled =
    user.role === "ADMIN" ||
    (isPaidModule(definition.slug) &&
      (await getEntitledModuleSlugs(user.id, user.role)).has(definition.slug));
  const unlock = entitled ? { locked: false, unlockHint: null } : await unlockFor(definition, userId);
  if (unlock.locked) {
    throw errors.conflict(
      unlock.unlockHint ?? "Complete the previous checkpoint first.",
    );
  }
  const now = new Date();
  const existing = await findAttempt(userId, definition.slug);
  if (existing?.completedAt) {
    throw errors.conflict("Checkpoint already completed.");
  }
  if (existing && checkpointStatus(now, existing) === "ACTIVE") {
    return toStartResult(
      definition.slug,
      existing.startedAt,
      existing.endsAt,
      now,
    );
  }
  const checkpointProblems = await loadProblems(
    definition.checkpoint.problemSlugs,
  );
  if (checkpointProblems.size !== definition.checkpoint.problemSlugs.length) {
    throw errors.unavailable("This checkpoint's problems are not seeded yet.");
  }

  const endsAt = new Date(
    now.getTime() + definition.checkpoint.durationMinutes * 60_000,
  );
  const [row] = await getDb()
    .insert(learningCheckpointAttempts)
    .values({
      userId,
      moduleSlug: definition.slug,
      startedAt: now,
      endsAt,
      completedAt: null,
    })
    .onConflictDoUpdate({
      target: [
        learningCheckpointAttempts.userId,
        learningCheckpointAttempts.moduleSlug,
      ],
      set: { startedAt: now, endsAt, completedAt: null, updatedAt: now },
      setWhere: isNull(learningCheckpointAttempts.completedAt),
    })
    .returning({
      startedAt: learningCheckpointAttempts.startedAt,
      endsAt: learningCheckpointAttempts.endsAt,
    });
  if (!row) throw errors.conflict("Checkpoint already completed.");
  return toStartResult(definition.slug, row.startedAt, row.endsAt, now);
}
