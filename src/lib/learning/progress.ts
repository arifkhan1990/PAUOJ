import type { Difficulty } from "@/lib/difficulty";
import type {
  LearningCheckpointDefinition,
  LearningCheckpointStatus,
  LearningCheckpointView,
  LearningProblemView,
  LearningProgress,
  LearningTopicDefinition,
  LearningTopicView,
} from "@/lib/learning/types";

export type CheckpointAttemptTiming = {
  startedAt: Date;
  endsAt: Date;
  completedAt: Date | null;
};

export type LearningProblemRow = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  points: number;
};

export type LearningSolvedFlags = {
  solved: Set<string>;
  attempted: Set<string>;
};

export function computeProgress(solved: number, total: number): LearningProgress {
  const safeTotal = Math.max(0, Math.trunc(total));
  if (safeTotal === 0) return { solved: 0, total: 0, percent: 0 };
  const safeSolved = Math.min(safeTotal, Math.max(0, Math.trunc(solved)));
  return {
    solved: safeSolved,
    total: safeTotal,
    percent: Math.round((safeSolved / safeTotal) * 100),
  };
}

export function checkpointStatus(
  now: Date,
  attempt: CheckpointAttemptTiming | null,
): LearningCheckpointStatus {
  if (!attempt) return "NOT_STARTED";
  if (attempt.completedAt) return "COMPLETED";
  if (now.getTime() >= attempt.endsAt.getTime()) return "EXPIRED";
  return "ACTIVE";
}

export function isCheckpointComplete(
  solvedSlugs: Iterable<string>,
  requiredSlugs: string[],
): boolean {
  if (requiredSlugs.length === 0) return false;
  const solved = new Set(solvedSlugs);
  return requiredSlugs.every((slug) => solved.has(slug));
}

export function progressForProblemViews(
  views: LearningProblemView[],
): LearningProgress {
  const total = new Set(views.map((view) => view.slug));
  const solved = new Set(
    views.filter((view) => view.solved).map((view) => view.slug),
  );
  return computeProgress(solved.size, total.size);
}

export function toLearningProblemViews(
  slugs: string[],
  rows: Map<string, LearningProblemRow>,
  flags: LearningSolvedFlags,
): LearningProblemView[] {
  const views: LearningProblemView[] = [];
  for (const slug of slugs) {
    const row = rows.get(slug);
    if (!row) continue;
    views.push({
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      points: row.points,
      solved: flags.solved.has(slug),
      attempted: flags.attempted.has(slug),
    });
  }
  return views;
}

export function buildLearningTopicView(
  topic: LearningTopicDefinition,
  rows: Map<string, LearningProblemRow>,
  flags: LearningSolvedFlags,
): LearningTopicView {
  const guided = toLearningProblemViews(topic.guidedProblemSlugs, rows, flags);
  const easy = toLearningProblemViews(
    topic.practiceProblemSlugs.easy,
    rows,
    flags,
  );
  const medium = toLearningProblemViews(
    topic.practiceProblemSlugs.medium,
    rows,
    flags,
  );
  const hard = toLearningProblemViews(
    topic.practiceProblemSlugs.hard,
    rows,
    flags,
  );
  const extra = toLearningProblemViews(topic.extraProblemSlugs, rows, flags);
  const all = [...guided, ...easy, ...medium, ...hard, ...extra];
  return {
    slug: topic.slug,
    title: topic.title,
    titleBn: topic.titleBn,
    summary: topic.summary,
    concept: topic.concept,
    guided,
    practice: { easy, medium, hard },
    extra,
    progress: progressForProblemViews(all),
    locked: false,
    unlockHint: null,
  };
}

export function isModuleUnlocked(
  order: number,
  previousBadgeEarned: boolean,
): boolean {
  return order <= 1 || previousBadgeEarned;
}

export function moduleUnlockHint(
  previousTitle: string,
  previousHasCheckpoint: boolean,
  previousBadgeEarned: boolean,
): string | null {
  if (previousBadgeEarned) return null;
  return previousHasCheckpoint
    ? `Complete the ${previousTitle} checkpoint to unlock this track.`
    : `${previousTitle} is still in production.`;
}

export function buildLearningCheckpointView(
  checkpoint: LearningCheckpointDefinition,
  attempt: CheckpointAttemptTiming | null,
  rows: Map<string, LearningProblemRow>,
  flags: LearningSolvedFlags,
  now: Date,
  windowSolved?: Set<string>,
): LearningCheckpointView {
  const checkpointFlags = windowSolved
    ? { solved: windowSolved, attempted: flags.attempted }
    : flags;
  const views = toLearningProblemViews(
    checkpoint.problemSlugs,
    rows,
    checkpointFlags,
  );
  const status = checkpointStatus(now, attempt);
  return {
    title: checkpoint.title,
    titleBn: checkpoint.titleBn,
    description: checkpoint.description,
    durationMinutes: checkpoint.durationMinutes,
    badge: checkpoint.badge,
    status,
    attempt: attempt
      ? {
          startedAt: attempt.startedAt.toISOString(),
          endsAt: attempt.endsAt.toISOString(),
          completedAt: attempt.completedAt?.toISOString() ?? null,
        }
      : null,
    problems: views,
    solvedCount: views.filter((view) => view.solved).length,
    problemCount: views.length,
    earned: status === "COMPLETED",
  };
}
