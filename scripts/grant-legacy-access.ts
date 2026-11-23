import "dotenv/config";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { getDb, closeDb } from "@/server/db";
import {
  learningCheckpointAttempts,
  lessonEntitlements,
  problems,
  submissions,
} from "@/server/db/schema";
import { PAID_MODULES } from "@/lib/learning/payments";
import { LEARNING_MODULES } from "@/lib/learning/modules";

/**
 * One-off pre-paywall migration for existing learners. Grants a SCHOLARSHIP
 * entitlement for every premium module where the user already has an accepted
 * practice submission or a completed checkpoint.
 *
 * Dry run by default; pass --apply to write.
 */
async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const paidSlugs = new Set(PAID_MODULES.map((module) => module.slug));

  const definitions = new Map(
    LEARNING_MODULES.filter((module) => paidSlugs.has(module.slug)).map(
      (module) => [module.slug, module],
    ),
  );
  const problemToModule = new Map<string, string>();
  for (const definition of definitions.values()) {
    for (const topic of definition.topics) {
      const slugs = [
        ...topic.guidedProblemSlugs,
        ...topic.practiceProblemSlugs.easy,
        ...topic.practiceProblemSlugs.medium,
        ...topic.practiceProblemSlugs.hard,
        ...topic.extraProblemSlugs,
      ];
      for (const slug of slugs) problemToModule.set(slug, definition.slug);
    }
  }

  const db = getDb();
  const grants = new Map<string, Set<string>>();
  const add = (userId: string, moduleSlug: string) => {
    const set = grants.get(userId) ?? new Set<string>();
    set.add(moduleSlug);
    grants.set(userId, set);
  };

  if (problemToModule.size > 0) {
    const rows = await db
      .select({ userId: submissions.userId, slug: problems.slug })
      .from(submissions)
      .innerJoin(problems, eq(problems.id, submissions.problemId))
      .where(
        and(
          eq(submissions.status, "ACCEPTED"),
          isNull(submissions.assessmentId),
          inArray(problems.slug, [...problemToModule.keys()]),
        ),
      );
    for (const row of rows) {
      const moduleSlug = problemToModule.get(row.slug);
      if (moduleSlug) add(row.userId, moduleSlug);
    }
  }

  const attempts = await db
    .select({
      userId: learningCheckpointAttempts.userId,
      moduleSlug: learningCheckpointAttempts.moduleSlug,
    })
    .from(learningCheckpointAttempts)
    .where(
      and(
        isNotNull(learningCheckpointAttempts.completedAt),
        inArray(learningCheckpointAttempts.moduleSlug, [...paidSlugs]),
      ),
    );
  for (const row of attempts) add(row.userId, row.moduleSlug);

  const total = [...grants.values()].reduce((sum, set) => sum + set.size, 0);
  process.stdout.write(
    `Legacy grant ${apply ? "APPLY" : "DRY RUN"}: ${grants.size} learners, ${total} module entitlements.\n`,
  );
  for (const [userId, modules] of [...grants].slice(0, 5)) {
    process.stdout.write(`  ${userId}: ${[...modules].join(", ")}\n`);
  }

  if (apply && total > 0) {
    const values = [...grants].flatMap(([userId, modules]) =>
      [...modules].map((moduleSlug) => ({
        userId,
        moduleSlug,
        source: "SCHOLARSHIP" as const,
      })),
    );
    const inserted = await db
      .insert(lessonEntitlements)
      .values(values)
      .onConflictDoNothing()
      .returning({ id: lessonEntitlements.id });
    process.stdout.write(`Inserted ${inserted.length} entitlements.\n`);
  } else if (!apply) {
    process.stdout.write("Re-run with --apply to write these grants.\n");
  }
}

main()
  .catch((error) => {
    console.error("Legacy grant failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await closeDb();
  });
