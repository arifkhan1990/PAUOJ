import "dotenv/config";
import { count, eq } from "drizzle-orm";
import { hashPassword } from "@/server/auth/password";
import { getDb, getSql } from "./index";
import { getEnv } from "../env";
import {
  problemTags,
  problems,
  submissions,
  tags,
  testCases,
  users,
} from "./schema";
import { seedStudyLists } from "./seed-study-lists";
import { SEED_PROBLEMS, type SeededProblem } from "./seed-problems";
import { ASSESSMENT_PROBLEMS } from "./seed-assessment-problems";
import { LEARNING_PROBLEMS } from "./learning";
import { DEMO_PASSWORD, DEMO_USERS, seedDemoData } from "./seed-demo";
import { seedAssessment } from "./seed-assessments";
import { attachTeacherDemoContent, seedTeacher } from "./seed-teacher";
import { seedContests } from "./seed-contests";
import { slugify } from "@/lib/utils";

async function seedAdmin(): Promise<string> {
  const env = getEnv();
  const db = getDb();
  const rows = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, env.SEED_ADMIN_EMAIL))
    .limit(1);
  const existing = rows[0];
  if (existing) {
    if (existing.role !== "ADMIN") {
      await db
        .update(users)
        .set({ role: "ADMIN", emailVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, existing.id));
    }
    return existing.id;
  }

  const passwordHash = await hashPassword(env.SEED_ADMIN_PASSWORD);
  const [created] = await db
    .insert(users)
    .values({
      username: env.SEED_ADMIN_USERNAME,
      email: env.SEED_ADMIN_EMAIL,
      displayName: "PAU OJ Admin",
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    })
    .returning({ id: users.id });
  if (!created) throw new Error("Could not create the seed administrator.");
  process.stdout.write(
    `Created admin ${env.SEED_ADMIN_USERNAME} <${env.SEED_ADMIN_EMAIL}>\n`,
  );
  return created.id;
}

async function seedProblems(adminId: string): Promise<Map<string, SeededProblem>> {
  const db = getDb();
  const result = new Map<string, SeededProblem>();

  for (const definition of [
    ...SEED_PROBLEMS,
    ...ASSESSMENT_PROBLEMS,
    ...LEARNING_PROBLEMS,
  ]) {
    const existingRows = await db
      .select({ id: problems.id })
      .from(problems)
      .where(eq(problems.slug, definition.slug))
      .limit(1);
    const existing = existingRows[0];

    const isPublic = definition.isPublic ?? true;
    let problemId: string;
    if (existing) {
      problemId = existing.id;
      await db
        .update(problems)
        .set({
          title: definition.title,
          statement: definition.statement,
          inputFormat: definition.inputFormat,
          outputFormat: definition.outputFormat,
          constraints: definition.constraints,
          editorial: definition.editorial,
          category: definition.category ?? null,
          subcategory: definition.subcategory ?? null,
          difficulty: definition.difficulty,
          points: definition.points,
          timeLimitMs: definition.timeLimitMs,
          memoryLimitMb: definition.memoryLimitMb,
          isPublic,
          publicationStatus: isPublic ? "PUBLISHED" : "DRAFT",
          publishedAt: isPublic ? new Date() : null,
          authorId: adminId,
          updatedAt: new Date(),
        })
        .where(eq(problems.id, problemId));
      await db.delete(problemTags).where(eq(problemTags.problemId, problemId));
      await db.delete(testCases).where(eq(testCases.problemId, problemId));
    } else {
      const [created] = await db
        .insert(problems)
        .values({
          slug: definition.slug,
          title: definition.title,
          statement: definition.statement,
          inputFormat: definition.inputFormat,
          outputFormat: definition.outputFormat,
          constraints: definition.constraints,
          editorial: definition.editorial,
          category: definition.category ?? null,
          subcategory: definition.subcategory ?? null,
          difficulty: definition.difficulty,
          points: definition.points,
          timeLimitMs: definition.timeLimitMs,
          memoryLimitMb: definition.memoryLimitMb,
          isPublic,
          publicationStatus: isPublic ? "PUBLISHED" : "DRAFT",
          publishedAt: isPublic ? new Date() : null,
          authorId: adminId,
        })
        .returning({ id: problems.id });
      if (!created) throw new Error(`Could not create ${definition.slug}`);
      problemId = created.id;
    }

    for (const name of definition.tags) {
      const slug = slugify(name);
      if (!slug) continue;
      const [tag] = await db
        .insert(tags)
        .values({ name, slug })
        .onConflictDoUpdate({ target: tags.slug, set: { name } })
        .returning({ id: tags.id });
      if (tag) {
        await db
          .insert(problemTags)
          .values({ problemId, tagId: tag.id })
          .onConflictDoNothing();
      }
    }

    const insertedTests = await db
      .insert(testCases)
      .values(
        definition.tests.map((test, index) => ({
          problemId,
          input: test.input,
          expectedOutput: test.expectedOutput,
          isSample: test.isSample,
          position: index + 1,
        })),
      )
      .returning({ id: testCases.id, position: testCases.position });

    result.set(definition.slug, {
      id: problemId,
      definition,
      tests: insertedTests,
    });
  }

  return result;
}

async function recomputeCounts(): Promise<void> {
  await getSql()`
    update problems p set
      accepted_count = (select count(*)::int from submissions s where s.problem_id = p.id and s.status = 'ACCEPTED'),
      submission_count = (select count(*)::int from submissions s where s.problem_id = p.id)
  `;
}

async function main(): Promise<void> {
  const env = getEnv();
  const db = getDb();
  const adminId = await seedAdmin();
  const problemMap = await seedProblems(adminId);
  const { activeId, activeStart, ended } = await seedContests(
    adminId,
    problemMap,
  );
  await seedStudyLists(adminId);

  const [submissionRow] = await db
    .select({ value: count() })
    .from(submissions);
  const hasAnySubmissions = Number(submissionRow?.value ?? 0) > 0;
  let assessment: Awaited<ReturnType<typeof seedAssessment>> | null = null;

  if (env.SEED_DEMO_DATA) {
    const demoTeacherId = await seedTeacher();
    await seedDemoData(activeId, activeStart, ended, problemMap);
    assessment = await seedAssessment(demoTeacherId, problemMap);
    await attachTeacherDemoContent(demoTeacherId);
  } else if (!hasAnySubmissions) {
    process.stdout.write("SEED_DEMO_DATA=false; skipping demo users and submissions.\n");
  }

  await recomputeCounts();

  const production = env.NODE_ENV === "production";
  if (env.SEED_ADMIN_PASSWORD === "ChangeMe123!") {
    process.stdout.write(
      "WARNING: the default seed password is still in use. Change it before exposing the judge.\n",
    );
  }
  process.stdout.write(
    [
      "Seed complete.",
      production
        ? `Admin: ${env.SEED_ADMIN_USERNAME} (password from SEED_ADMIN_PASSWORD)`
        : `Admin: ${env.SEED_ADMIN_USERNAME} / ${env.SEED_ADMIN_PASSWORD}`,
      env.SEED_DEMO_DATA
        ? `Demo users: ${DEMO_USERS.map((user) => user.username).join(", ")} / ${DEMO_PASSWORD}`
        : "Demo data disabled.",
      env.SEED_DEMO_DATA
        ? `Demo teachers: teacher, teacher2 / ${DEMO_PASSWORD}`
        : "Demo teachers disabled.",
      assessment
        ? `Assessment: /assessments/${assessment.slug} · code ${assessment.accessCode}`
        : "Demo assessment disabled.",
      "",
    ].join("\n"),
  );
}

main()
  .then(async () => {
    await (await import("./index")).closeDb();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await (await import("./index")).closeDb();
    process.exit(1);
  });
