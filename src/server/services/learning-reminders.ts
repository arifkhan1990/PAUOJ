import { and, count, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import {
  learningCheckpointAttempts,
  lessonEntitlements,
  problems,
  submissions,
} from "@/server/db/schema";
import {
  findModuleForProblemSlug,
  idleDaysSince,
  latestActivity,
  moduleProblemSlugs,
  selectReminderThreshold,
  type LearningReminderThreshold,
} from "@/lib/learning/activity";
import { LEARNING_MODULES } from "@/lib/learning/modules";
import type { LearningModuleDefinition } from "@/lib/learning/types";
import { logger } from "@/server/logger";
import { notifyUser } from "./notifications";

type ModuleCandidates = {
  /** Newest known activity per user, merged across all candidate sources. */
  lastActivity: Map<string, Date>;
  /** Users whose checkpoint is complete: they finished the course. */
  finished: Set<string>;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function collectCandidates(
  course: LearningModuleDefinition,
): Promise<ModuleCandidates> {
  const db = getDb();
  const slugs = moduleProblemSlugs(course);
  const [grants, solved, attempts] = await Promise.all([
    db
      .select({
        userId: lessonEntitlements.userId,
        createdAt: lessonEntitlements.createdAt,
      })
      .from(lessonEntitlements)
      .where(eq(lessonEntitlements.moduleSlug, course.slug)),
    slugs.length === 0
      ? Promise.resolve([] as Array<{ userId: string; lastAt: Date | null }>)
      : db
          .select({
            userId: submissions.userId,
            lastAt: sql<Date | null>`max(${submissions.createdAt})`,
          })
          .from(submissions)
          .innerJoin(problems, eq(problems.id, submissions.problemId))
          .where(
            and(
              eq(submissions.status, "ACCEPTED"),
              isNull(submissions.assessmentId),
              isNull(submissions.virtualContestId),
              inArray(problems.slug, slugs),
            ),
          )
          .groupBy(submissions.userId),
    db
      .select({
        userId: learningCheckpointAttempts.userId,
        updatedAt: learningCheckpointAttempts.updatedAt,
        completedAt: learningCheckpointAttempts.completedAt,
      })
      .from(learningCheckpointAttempts)
      .where(eq(learningCheckpointAttempts.moduleSlug, course.slug)),
  ] as const);

  const lastActivity = new Map<string, Date>();
  const finished = new Set<string>();
  const merge = (userId: string, date: Date | null): void => {
    const latest = latestActivity([lastActivity.get(userId) ?? null, date]);
    if (latest) lastActivity.set(userId, latest);
  };

  for (const grant of grants) merge(grant.userId, grant.createdAt);
  // `max()` comes back as a string from the raw SQL aggregate even though the
  // column is timestamptz, so normalise before doing date math.
  for (const row of solved) {
    merge(row.userId, row.lastAt ? new Date(row.lastAt) : null);
  }
  for (const attempt of attempts) {
    merge(attempt.userId, attempt.updatedAt);
    if (attempt.completedAt) finished.add(attempt.userId);
  }
  return { lastActivity, finished };
}

function reminderCopy(
  course: LearningModuleDefinition,
  idleDays: number,
): { title: string; body: string } {
  return {
    title: `Keep going: ${course.title}`,
    body: `It has been ${idleDays} days since your last activity in ${course.title}. Solve one problem to pick up where you left off.`,
  };
}

async function notifyIdleLearner(
  userId: string,
  course: LearningModuleDefinition,
  threshold: LearningReminderThreshold,
  idleDays: number,
): Promise<boolean> {
  const { title, body } = reminderCopy(course, idleDays);
  try {
    return await notifyUser({
      userId,
      type: "LEARNING_REMINDER",
      title,
      body,
      href: `/learn/${course.slug}`,
      dedupeKey: `course-inactive:${course.slug}:${threshold}`,
    });
  } catch (error) {
    logger.warn("Learning inactivity notification failed", {
      userId,
      moduleSlug: course.slug,
      error: errorMessage(error),
    });
    return false;
  }
}

async function remindIdleLearners(
  course: LearningModuleDefinition,
  now: Date,
): Promise<number> {
  const { lastActivity, finished } = await collectCandidates(course);
  let sent = 0;
  for (const [userId, last] of lastActivity) {
    if (finished.has(userId)) continue;
    const idleDays = idleDaysSince(last, now);
    const threshold = selectReminderThreshold(idleDays);
    if (!threshold) continue;
    if (await notifyIdleLearner(userId, course, threshold, idleDays)) sent += 1;
  }
  return sent;
}

/** Daily sweep: nudge learners who have gone quiet inside a live course. */
export async function runLearningInactivityReminders(
  now: Date = new Date(),
): Promise<number> {
  let sent = 0;
  for (const course of LEARNING_MODULES) {
    if (course.status !== "LIVE") continue;
    sent += await remindIdleLearners(course, now);
  }
  return sent;
}

/**
 * Called after a submission is judged: the first accepted solve inside a
 * course enrolls the learner. Later solves stay silent.
 */
export async function notifyModuleEnrollmentForProblem(
  userId: string,
  problemSlug: string,
): Promise<void> {
  const course = findModuleForProblemSlug(problemSlug);
  if (!course) return;
  try {
    const slugs = moduleProblemSlugs(course);
    if (slugs.length === 0) return;
    const [row] = await getDb()
      .select({ value: count() })
      .from(submissions)
      .innerJoin(problems, eq(problems.id, submissions.problemId))
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.status, "ACCEPTED"),
          isNull(submissions.assessmentId),
          isNull(submissions.virtualContestId),
          inArray(problems.slug, slugs),
        ),
      );
    if (Number(row?.value ?? 0) !== 1) return;
    await notifyUser({
      userId,
      type: "LEARNING_ENROLLMENT",
      title: `Welcome to ${course.title}`,
      body: "You've started this course. Finish the topics and the checkpoint to earn its badge.",
      href: `/learn/${course.slug}`,
      dedupeKey: `course-enrolled:${course.slug}`,
    });
  } catch (error) {
    logger.warn("Learning enrollment notification failed", {
      userId,
      problemSlug,
      error: errorMessage(error),
    });
  }
}
