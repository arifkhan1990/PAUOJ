import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { problemContributions, problems } from "@/server/db/schema";

export type ProfileEditorialStats = {
  count: number;
  editorials: {
    problemSlug: string;
    problemTitle: string;
    approvedAt: string;
  }[];
};

export async function getProfileEditorials(
  userId: string,
): Promise<ProfileEditorialStats> {
  const db = getDb();
  const [countRow, rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(problemContributions)
      .where(
        and(
          eq(problemContributions.contributorId, userId),
          eq(problemContributions.kind, "EDITORIAL"),
          eq(problemContributions.status, "APPROVED"),
        ),
      ),
    db
      .select({
        problemSlug: problems.slug,
        problemTitle: problems.title,
        approvedAt: problemContributions.reviewedAt,
      })
      .from(problemContributions)
      .innerJoin(problems, eq(problems.id, problemContributions.problemId))
      .where(
        and(
          eq(problemContributions.contributorId, userId),
          eq(problemContributions.kind, "EDITORIAL"),
          eq(problemContributions.status, "APPROVED"),
        ),
      )
      .orderBy(desc(problemContributions.reviewedAt))
      .limit(6),
  ]);
  return {
    count: Number(countRow[0]?.value ?? 0),
    editorials: rows
      .filter((row) => row.approvedAt !== null)
      .map((row) => ({
        problemSlug: row.problemSlug,
        problemTitle: row.problemTitle,
        approvedAt: row.approvedAt!.toISOString(),
      })),
  };
}
