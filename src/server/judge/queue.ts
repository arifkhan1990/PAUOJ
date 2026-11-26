import { Queue } from "bullmq";
import { getRedis } from "@/server/redis";
import type { RunCheckerType } from "./compare-output";
import type { JudgeLanguage } from "./types";

export const JUDGE_QUEUE = "pauoj-judge";

export type SubmissionJob = {
  kind: "submission";
  submissionId: string;
};

export type RunJob = {
  kind: "run";
  userId: string;
  runId: string;
  language: JudgeLanguage;
  source: string;
  stdin: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  sqlScript?: boolean;
  /** Practice problems only: the reference solution used to derive output. */
  reference?: {
    language: JudgeLanguage;
    source: string;
    /** SQL script labs need the multi-statement runner. */
    sqlScript?: boolean;
  } | null;
  checker?: { type: RunCheckerType; floatTolerance: number } | null;
};

export type JudgeJobData = SubmissionJob | RunJob;

type QueueCache = {
  queue: Queue<JudgeJobData>;
};

const globalForQueue = globalThis as typeof globalThis & {
  __pauojJudgeQueue?: QueueCache;
};

export function getJudgeQueue(): Queue<JudgeJobData> {
  if (!globalForQueue.__pauojJudgeQueue) {
    const queue = new Queue<JudgeJobData>(JUDGE_QUEUE, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 1,
        removeOnComplete: { age: 24 * 60 * 60, count: 5000 },
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 1000 },
      },
    });
    globalForQueue.__pauojJudgeQueue = { queue };
  }
  return globalForQueue.__pauojJudgeQueue.queue;
}

export async function enqueueSubmission(submissionId: string): Promise<void> {
  await getJudgeQueue().add("submission", {
    kind: "submission",
    submissionId,
  });
}

export async function enqueueSubmissions(
  submissionIds: string[],
): Promise<void> {
  if (submissionIds.length === 0) return;
  await getJudgeQueue().addBulk(
    submissionIds.map((submissionId) => ({
      name: "submission",
      data: { kind: "submission" as const, submissionId },
    })),
  );
}

export async function enqueueRun(job: Omit<RunJob, "kind">): Promise<void> {
  await getJudgeQueue().add("run", { kind: "run", ...job });
}
