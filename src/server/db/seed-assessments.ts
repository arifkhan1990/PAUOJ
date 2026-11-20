import { eq } from "drizzle-orm";
import { getDb } from "./index";
import {
  assessmentProblems,
  assessments,
} from "./schema";
import type { SeededProblem } from "./seed-problems";

export type SeededAssessment = {
  id: string;
  slug: string;
  accessCode: string;
};

export async function seedAssessment(
  adminId: string,
  problemMap: Map<string, SeededProblem>,
): Promise<SeededAssessment> {
  const db = getDb();
  const now = Date.now();
  const slug = "pau-coding-assessment-2026";
  const accessCode = "PAU-TEST-2026";
  const startAt = new Date(now - 60 * 60 * 1000);
  const endAt = new Date(now + 7 * 24 * 60 * 60 * 1000);
  const problemSlugs = [
    "assessment-pair-sum",
    "assessment-vowel-count",
    "assessment-grid-path",
  ];

  const problemIds = problemSlugs.map((problemSlug) => {
    const problem = problemMap.get(problemSlug);
    if (!problem) throw new Error(`Missing assessment problem ${problemSlug}`);
    return problem.id;
  });

  const rows = await db
    .select({ id: assessments.id })
    .from(assessments)
    .where(eq(assessments.slug, slug))
    .limit(1);

  let assessmentId: string;
  if (rows[0]) {
    assessmentId = rows[0].id;
    await db
      .update(assessments)
      .set({
        title: "PAU Coding Assessment 2026",
        description:
          "A private 90-minute coding assessment for PAU students. Join with the access code, solve the problems in any supported language and finish before your timer ends. Your source code is private to you and the administrators.",
        accessCode,
        startAt,
        endAt,
        durationMinutes: 90,
        isPublished: true,
        createdBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(assessments.id, assessmentId));
    await db
      .delete(assessmentProblems)
      .where(eq(assessmentProblems.assessmentId, assessmentId));
  } else {
    const [created] = await db
      .insert(assessments)
      .values({
        slug,
        title: "PAU Coding Assessment 2026",
        description:
          "A private 90-minute coding assessment for PAU students. Join with the access code, solve the problems in any supported language and finish before your timer ends. Your source code is private to you and the administrators.",
        accessCode,
        startAt,
        endAt,
        durationMinutes: 90,
        isPublished: true,
        createdBy: adminId,
      })
      .returning({ id: assessments.id });
    if (!created) throw new Error("Could not create the seed assessment.");
    assessmentId = created.id;
  }

  await db.insert(assessmentProblems).values(
    problemIds.map((problemId, index) => ({
      assessmentId,
      problemId,
      label: String.fromCharCode(65 + index),
      position: String(index).padStart(2, "0"),
    })),
  );

  return { id: assessmentId, slug, accessCode };
}
