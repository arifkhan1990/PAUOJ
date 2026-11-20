import { eq } from "drizzle-orm";
import { getDb } from "./index";
import {
  contestProblemApprovals,
  contestProblems,
  contests,
} from "./schema";
import type { SeededProblem } from "./seed-problems";
import { ratedContestSeedDefinitions } from "./seed-rated-contests";

async function upsertContest(input: {
  adminId: string;
  slug: string;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  problemSlugs: string[];
  problemMap: Map<string, SeededProblem>;
}): Promise<string> {
  const db = getDb();
  const rows = await db
    .select({ id: contests.id })
    .from(contests)
    .where(eq(contests.slug, input.slug))
    .limit(1);

  let contestId: string;
  if (rows[0]) {
    contestId = rows[0].id;
    await db
      .update(contests)
      .set({
        title: input.title,
        description: input.description,
        startAt: input.startAt,
        endAt: input.endAt,
        isPublic: true,
        updatedAt: new Date(),
      })
      .where(eq(contests.id, contestId));
    await db
      .delete(contestProblems)
      .where(eq(contestProblems.contestId, contestId));
  } else {
    const [created] = await db
      .insert(contests)
      .values({
        slug: input.slug,
        title: input.title,
        description: input.description,
        startAt: input.startAt,
        endAt: input.endAt,
        isPublic: true,
        createdBy: input.adminId,
      })
      .returning({ id: contests.id });
    if (!created) throw new Error(`Could not create contest ${input.slug}`);
    contestId = created.id;
  }

  const links = input.problemSlugs.map((slug, index) => {
    const problem = input.problemMap.get(slug);
    if (!problem) throw new Error(`Missing seed problem ${slug}`);
    return {
      contestId,
      problemId: problem.id,
      label: String.fromCharCode(65 + index),
      position: String(index).padStart(2, "0"),
    };
  });
  await db
    .delete(contestProblemApprovals)
    .where(eq(contestProblemApprovals.contestId, contestId));
  await db.insert(contestProblems).values(links);
  await db
    .insert(contestProblemApprovals)
    .values(
      links.map((link) => ({
        contestId: link.contestId,
        problemId: link.problemId,
        status: "APPROVED" as const,
        reviewedAt: new Date(),
      })),
    )
    .onConflictDoNothing();
  return contestId;
}

export type SeededEndedContest = {
  id: string;
  slug: string;
  startAt: Date;
};

export async function seedContests(
  adminId: string,
  problemMap: Map<string, SeededProblem>,
): Promise<{
  activeId: string;
  activeStart: Date;
  ended: SeededEndedContest[];
}> {
  const now = Date.now();
  const activeStart = new Date(now - 2 * 24 * 60 * 60 * 1000);
  const activeEnd = new Date(now + 5 * 24 * 60 * 60 * 1000);
  const activeId = await upsertContest({
    adminId,
    slug: "pauoj-launch-2026",
    title: "PAUOJ Launch Contest",
    description:
      "The first official contest on the new PAU Online Judge. Four problems, ICPC scoring, and plenty of bragging rights. Register, submit, and watch the live scoreboard.",
    startAt: activeStart,
    endAt: activeEnd,
    problemSlugs: [
      "a-plus-b",
      "array-rotation",
      "prime-counter",
      "balanced-brackets",
    ],
    problemMap,
  });

  const endedDefinitions = ratedContestSeedDefinitions(now);

  const ended: SeededEndedContest[] = [];
  for (const definition of endedDefinitions) {
    const id = await upsertContest({
      adminId,
      ...definition,
      problemMap,
    });
    ended.push({ id, slug: definition.slug, startAt: definition.startAt });
  }

  await upsertContest({
    adminId,
    slug: "pau-intra-2026",
    title: "PAU Intra University Contest",
    description:
      "The flagship intra-university contest. Graphs, strings and dynamic programming at contest pace. The problem set unlocks when the contest starts.",
    startAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
    endAt: new Date(now + 9 * 24 * 60 * 60 * 1000),
    problemSlugs: [
      "longest-increasing-subsequence",
      "shortest-path",
      "balanced-brackets",
    ],
    problemMap,
  });

  return { activeId, activeStart, ended };
}
