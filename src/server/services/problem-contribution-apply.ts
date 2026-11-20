import { eq, sql } from "drizzle-orm";
import type { Database } from "@/server/db";
import {
  problemContributions,
  problems,
  testCases,
} from "@/server/db/schema";
import type {
  ContributionTest,
  EditorialContributionPayload,
  StatementContributionPayload,
  TestsContributionPayload,
} from "@/lib/contribution-types";

type Transaction = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export async function applyContribution(
  tx: Transaction,
  contribution: typeof problemContributions.$inferSelect,
  problemId: string,
): Promise<void> {
  const now = new Date();
  if (contribution.kind === "STATEMENT") {
    const payload = contribution.payload as StatementContributionPayload;
    await tx
      .update(problems)
      .set({
        statement: payload.statement,
        inputFormat: payload.inputFormat,
        outputFormat: payload.outputFormat,
        constraints: payload.constraints,
        updatedAt: now,
      })
      .where(eq(problems.id, problemId));
    return;
  }
  if (contribution.kind === "EDITORIAL") {
    const payload = contribution.payload as EditorialContributionPayload;
    await tx
      .update(problems)
      .set({ editorial: payload.editorial, updatedAt: now })
      .where(eq(problems.id, problemId));
    return;
  }

  const payload = contribution.payload as TestsContributionPayload;
  const tests: ContributionTest[] = payload.tests;
  const [maxRow] = await tx
    .select({
      value: sql<number>`coalesce(max(${testCases.position}), 0)::int`,
    })
    .from(testCases)
    .where(eq(testCases.problemId, problemId));
  const start = Number(maxRow?.value ?? 0) + 1;
  await tx.insert(testCases).values(
    tests.map((test, index) => ({
      problemId,
      input: test.input,
      expectedOutput: test.expectedOutput,
      isSample: test.isSample,
      position: start + index,
    })),
  );
  await tx
    .update(problems)
    .set({ updatedAt: now })
    .where(eq(problems.id, problemId));
}
