import { eq, inArray } from "drizzle-orm";
import { hashPassword } from "@/server/auth/password";
import { finalizeContestRatings } from "@/server/services/ratings";
import type { LanguageId } from "@/lib/languages";
import { getDb } from "./index";
import {
  contestRatingChanges,
  contestRegistrations,
  contests,
  problems,
  submissionResults,
  submissions,
  users,
} from "./schema";
import type { SeededProblem } from "./seed-problems";

export const DEMO_USERS = [
  { username: "rakib", displayName: "Rakib Hasan", rating: 1780 },
  { username: "nusrat", displayName: "Nusrat Jahan", rating: 1710 },
  { username: "tanvir", displayName: "Tanvir Ahmed", rating: 1640 },
  { username: "sadia", displayName: "Sadia Islam", rating: 1580 },
];

export const DEMO_PASSWORD = "Demo@12345";

async function insertAcceptedSubmission(input: {
  userId: string;
  problem: SeededProblem;
  createdAt: Date;
  contestId: string | null;
}): Promise<void> {
  const db = getDb();
  const runtimeMs = 18 + ((input.problem.tests.length * 13) % 40);
  const memoryKb = 5200 + ((input.problem.tests.length * 311) % 4000);
  const [submission] = await db
    .insert(submissions)
    .values({
      userId: input.userId,
      problemId: input.problem.id,
      contestId: input.contestId,
      language: "python",
      sourceCode: input.problem.definition.referencePython,
      status: "ACCEPTED",
      passedTests: input.problem.tests.length,
      totalTests: input.problem.tests.length,
      runtimeMs,
      memoryKb,
      judgedAt: new Date(input.createdAt.getTime() + 1500),
      createdAt: input.createdAt,
    })
    .returning({ id: submissions.id });
  if (!submission) return;
  await db.insert(submissionResults).values(
    input.problem.tests.map((test) => ({
      submissionId: submission.id,
      testCaseId: test.id,
      position: test.position,
      status: "ACCEPTED" as const,
      runtimeMs,
      memoryKb,
    })),
  );
}

const WRONG_SOURCE: Record<LanguageId, string> = {
  python: 'print("not quite")\n',
  cpp: "#include <bits/stdc++.h>\nint main() { return 0; }\n",
  c: "int main(void) { return 0; }\n",
  java: "public class Main { public static void main(String[] args) {} }\n",
  javascript: 'console.log("not quite");\n',
  csharp: "class Program { static void Main() {} }\n",
  go: "package main\nfunc main() {}\n",
  php: '<?php echo "not quite";\n',
  kotlin: "fun main() {}\n",
  swift: 'print("not quite")\n',
  sql: 'SELECT 1;\n',
  mysql: 'SELECT 1;\n',
  postgresql: 'SELECT 1;\n', 
};

async function insertWrongAttempt(input: {
  userId: string;
  problem: SeededProblem;
  createdAt: Date;
  contestId: string | null;
  language?: LanguageId;
}): Promise<void> {
  const db = getDb();
  const language = input.language ?? "python";
  await db.insert(submissions).values({
    userId: input.userId,
    problemId: input.problem.id,
    contestId: input.contestId,
    language,
    sourceCode: WRONG_SOURCE[language] ?? WRONG_SOURCE.python,
    status: "WRONG_ANSWER",
    passedTests: 1,
    totalTests: input.problem.tests.length,
    runtimeMs: 12,
    memoryKb: 4300,
    judgedAt: new Date(input.createdAt.getTime() + 1200),
    createdAt: input.createdAt,
  });
}

export async function seedDemoData(
  activeContestId: string,
  activeStart: Date,
  endedContests: Array<{ id: string; slug: string; startAt: Date }>,
  problemMap: Map<string, SeededProblem>,
): Promise<void> {
  const db = getDb();
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const demoIds: string[] = [];

  for (const demo of DEMO_USERS) {
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, demo.username))
      .limit(1);
    if (rows[0]) {
      demoIds.push(rows[0].id);
      await db
        .update(users)
        .set({
          emailVerifiedAt: new Date(),
          rating: demo.rating,
          updatedAt: new Date(),
        })
        .where(eq(users.id, rows[0].id));
      continue;
    }
    const [created] = await db
      .insert(users)
      .values({
        username: demo.username,
        email: `${demo.username}@pauoj.local`,
        displayName: demo.displayName,
        passwordHash,
        rating: demo.rating,
        emailVerifiedAt: new Date(),
      })
      .returning({ id: users.id });
    if (created) demoIds.push(created.id);
  }

  if (demoIds.length === 0) return;

  const rakibId = demoIds[DEMO_USERS.findIndex((user) => user.username === "rakib")];
  if (rakibId) {
    await db
      .update(problems)
      .set({ authorId: rakibId, updatedAt: new Date() })
      .where(inArray(problems.slug, ["a-plus-b", "reverse-array"]));
    await db
      .update(contests)
      .set({ createdBy: rakibId, updatedAt: new Date() })
      .where(eq(contests.slug, "pau-autumn-2026"));
  }

  await db
    .delete(submissions)
    .where(inArray(submissions.userId, demoIds));
  await db
    .delete(contestRatingChanges)
    .where(inArray(contestRatingChanges.userId, demoIds));
  await db
    .update(contests)
    .set({ ratedAt: null, updatedAt: new Date() })
    .where(inArray(contests.id, endedContests.map((contest) => contest.id)));

  await db
    .insert(contestRegistrations)
    .values(
      [activeContestId, ...endedContests.map((contest) => contest.id)].flatMap(
        (contestId) =>
          demoIds.map((userId) => ({ contestId, userId })),
      ),
    )
    .onConflictDoNothing();

  const practiceSets: Record<string, string[]> = {
    rakib: ["a-plus-b", "array-rotation", "prime-counter", "balanced-brackets"],
    nusrat: [
      "a-plus-b",
      "reverse-array",
      "matrix-multiplication",
      "longest-increasing-subsequence",
    ],
    tanvir: ["a-plus-b", "prime-counter", "shortest-path"],
    sadia: ["a-plus-b", "reverse-array", "array-rotation"],
  };
  const contestSets: Record<string, string[]> = {
    rakib: ["a-plus-b", "array-rotation", "balanced-brackets"],
    nusrat: ["prime-counter", "balanced-brackets"],
    tanvir: ["a-plus-b", "prime-counter"],
    sadia: ["array-rotation", "balanced-brackets"],
  };
  const languagePractice: Record<
    string,
    Array<{ slug: string; language: LanguageId }>
  > = {
    rakib: [
      { slug: "a-plus-b", language: "cpp" },
      { slug: "array-rotation", language: "java" },
      { slug: "balanced-brackets", language: "javascript" },
    ],
    nusrat: [
      { slug: "reverse-array", language: "c" },
      { slug: "matrix-multiplication", language: "java" },
      { slug: "longest-increasing-subsequence", language: "go" },
    ],
    tanvir: [
      { slug: "prime-counter", language: "cpp" },
      { slug: "shortest-path", language: "go" },
    ],
    sadia: [
      { slug: "a-plus-b", language: "javascript" },
      { slug: "array-rotation", language: "php" },
    ],
  };

  const endedSets: Record<string, Record<string, string[]>> = {
    "pau-autumn-2026": {
      rakib: ["reverse-array", "prime-counter", "balanced-brackets"],
      nusrat: ["reverse-array", "prime-counter"],
      tanvir: ["reverse-array"],
      sadia: ["prime-counter"],
    },
    "pau-winter-2026": {
      nusrat: [
        "matrix-multiplication",
        "longest-increasing-subsequence",
        "shortest-path",
      ],
      sadia: ["matrix-multiplication", "shortest-path"],
      rakib: ["matrix-multiplication"],
      tanvir: ["matrix-multiplication"],
    },
    "pau-spring-2026": {
      rakib: [
        "reverse-array",
        "matrix-multiplication",
        "longest-increasing-subsequence",
      ],
      nusrat: ["reverse-array", "matrix-multiplication"],
      tanvir: ["reverse-array"],
      sadia: ["matrix-multiplication"],
    },
  };

  for (let userIndex = 0; userIndex < DEMO_USERS.length; userIndex += 1) {
    const demo = DEMO_USERS[userIndex];
    const userId = demoIds[userIndex];
    if (!demo || !userId) continue;

    const practiceSlugs = practiceSets[demo.username] ?? [];
    for (let index = 0; index < practiceSlugs.length; index += 1) {
      const problem = problemMap.get(practiceSlugs[index] ?? "");
      if (!problem) continue;
      const createdAt = new Date(
        Date.now() - (20 - userIndex * 2 - index) * 24 * 60 * 60 * 1000,
      );
      await insertAcceptedSubmission({
        userId,
        problem,
        createdAt,
        contestId: null,
      });
    }

    const languageMix = languagePractice[demo.username] ?? [];
    for (let index = 0; index < languageMix.length; index += 1) {
      const entry = languageMix[index];
      const problem = problemMap.get(entry?.slug ?? "");
      if (!entry || !problem) continue;
      const createdAt = new Date(
        Date.now() - (12 - index * 3 - userIndex) * 24 * 60 * 60 * 1000,
      );
      await insertWrongAttempt({
        userId,
        problem,
        createdAt,
        contestId: null,
        language: entry.language,
      });
    }

    if (demo.username === "rakib") {
      const hardest = problemMap.get("shortest-path");
      if (hardest) {
        await insertWrongAttempt({
          userId,
          problem: hardest,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          contestId: null,
          language: "cpp",
        });
      }
    }

    const contestSlugs = contestSets[demo.username] ?? [];
    for (let index = 0; index < contestSlugs.length; index += 1) {
      const problem = problemMap.get(contestSlugs[index] ?? "");
      if (!problem) continue;
      const createdAt = new Date(
        activeStart.getTime() + (15 + index * 24 + userIndex * 7) * 60_000,
      );
      if (index === contestSlugs.length - 1 && userIndex % 2 === 0) {
        await insertWrongAttempt({
          userId,
          problem,
          createdAt: new Date(createdAt.getTime() - 6 * 60_000),
          contestId: activeContestId,
        });
      }
      await insertAcceptedSubmission({
        userId,
        problem,
        createdAt,
        contestId: activeContestId,
      });
    }

    for (const contest of endedContests) {
      const endedSlugs = endedSets[contest.slug]?.[demo.username] ?? [];
      for (let index = 0; index < endedSlugs.length; index += 1) {
        const problem = problemMap.get(endedSlugs[index] ?? "");
        if (!problem) continue;
        const createdAt = new Date(
          contest.startAt.getTime() +
            (10 + index * 28 + userIndex * 9) * 60_000,
        );
        await insertAcceptedSubmission({
          userId,
          problem,
          createdAt,
          contestId: contest.id,
        });
      }
    }
  }

  for (const contest of [...endedContests].sort(
    (left, right) => left.startAt.getTime() - right.startAt.getTime(),
  )) {
    await finalizeContestRatings(contest.slug);
  }
}

