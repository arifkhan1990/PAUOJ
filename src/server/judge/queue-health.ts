import { getJudgeQueue } from "./queue";

/** BullMQ job counts exposed on `/health`. */
export type JudgeQueueCounts = {
  waiting: number;
  active: number;
  prioritized: number;
  delayed: number;
  failed: number;
};

const ZERO_COUNTS: JudgeQueueCounts = {
  waiting: 0,
  active: 0,
  prioritized: 0,
  delayed: 0,
  failed: 0,
};

/** Bound the probe so a stalled Redis cannot hang `/health`. */
const PROBE_TIMEOUT_MS = 2000;

function toCount(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.trunc(numeric);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Judge queue probe timed out.")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Read the `pauoj-judge` queue depth for the health endpoint.
 *
 * Never throws: Redis/BullMQ errors (and a probe timeout) degrade to zeros so a
 * queue backlog can be reported without turning the service unhealthy.
 */
export async function getJudgeQueueCounts(): Promise<JudgeQueueCounts> {
  try {
    const counts = await withTimeout(
      getJudgeQueue().getJobCounts(
        "waiting",
        "active",
        "prioritized",
        "delayed",
        "failed",
      ),
      PROBE_TIMEOUT_MS,
    );
    return {
      waiting: toCount(counts.waiting),
      active: toCount(counts.active),
      prioritized: toCount(counts.prioritized),
      delayed: toCount(counts.delayed),
      failed: toCount(counts.failed),
    };
  } catch {
    return { ...ZERO_COUNTS };
  }
}
