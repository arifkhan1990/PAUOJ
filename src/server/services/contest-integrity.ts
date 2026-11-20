import { and, desc, eq, isNull } from "drizzle-orm";
import { errors } from "@/server/api/errors";
import { getDb } from "@/server/db";
import {
  contests,
  problems,
  submissions,
  users,
} from "@/server/db/schema";
import {
  findPlagiarismPairs,
  type PlagiarismPair,
} from "@/server/contests/plagiarism";

export async function getContestPlagiarismReport(contestId: string): Promise<{
  contest: { title: string; slug: string };
  submissionCount: number;
  pairs: PlagiarismPair[];
}> {
  const db = getDb();
  const [contest] = await db
    .select({ title: contests.title, slug: contests.slug })
    .from(contests)
    .where(eq(contests.id, contestId))
    .limit(1);
  if (!contest) throw errors.notFound("Contest not found.");

  const rows = await db
    .select({
      id: submissions.id,
      userId: submissions.userId,
      username: users.username,
      problemId: submissions.problemId,
      problemTitle: problems.title,
      language: submissions.language,
      sourceCode: submissions.sourceCode,
    })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.userId))
    .innerJoin(problems, eq(problems.id, submissions.problemId))
    .where(
      and(
        eq(submissions.contestId, contestId),
        isNull(submissions.virtualContestId),
      ),
    )
    .orderBy(desc(submissions.createdAt))
    .limit(800);

  return {
    contest,
    submissionCount: rows.length,
    pairs: findPlagiarismPairs(rows),
  };
}
