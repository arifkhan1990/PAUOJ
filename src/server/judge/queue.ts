import { Queue } from "bullmq";
import { getRedis } from "@/server/redis";
import type { RunCheckerType } from "./compare-output";
import type { JudgeLanguage } from "./types";

export const JUDGE_QUEUE = "pauoj-judge";

/** BullMQ: lower number = higher priority. */
export const LIVE_PRIORITY = 1;
export const PRACTICE_PRIORITY = 10;

export type SubmissionPriorityInput = {
  contestId: string | null;
  assessmentId: string | null;
  virtualContestId: string | null;
};

/**
 * Live timed contexts (real contests, assessments) outrank practice work.
 * Virtual contests are self-paced practice and stay in the practice tier.
 */
export function submissionPriority(input: SubmissionPriorityInput): number {
  const live =
    !input.virtualContestId &&
    (Boolean(input.contestId) || Boolean(input.assessmentId));
  return live ? LIVE_PRIORITY : PRACTICE_PRIORITY;
}

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

export async function enqueueSubmission(
  submissionId: string,
  options: { priority?: number } = {},
): Promise<void> {
  await getJudgeQueue().add(
    "submission",
    { kind: "submission", submissionId },
    // Every job gets an explicit priority: BullMQ drains unprioritized jobs
    // before prioritized ones, so a missing priority would starve contests.
    { priority: options.priority ?? PRACTICE_PRIORITY },
  );
}

export async function enqueueSubmissions(
  submissionIds: string[],
  options: { priority?: number } = {},
): Promise<void> {
  if (submissionIds.length === 0) return;
  const priority = options.priority ?? PRACTICE_PRIORITY;
  await getJudgeQueue().addBulk(
    submissionIds.map((submissionId) => ({
      name: "submission",
      data: { kind: "submission" as const, submissionId },
      opts: { priority },
    })),
  );
}

export async function enqueueRun(job: Omit<RunJob, "kind">): Promise<void> {
  await getJudgeQueue().add("run", { kind: "run", ...job }, {
    priority: PRACTICE_PRIORITY,
  });
}
