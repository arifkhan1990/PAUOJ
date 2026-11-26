import { logger } from "@/server/logger";
import { getRedis, getSubscriberRedis } from "@/server/redis";

export const SUBMISSION_CHANNEL_PREFIX = "pauoj:submission:";

export type SubmissionListener = () => void;

/**
 * Minimal Redis subscriber surface, so tests can inject a fake without a
 * real Redis connection. Matches the ioredis methods we depend on.
 */
export type RedisSubscriber = {
  subscribe(channel: string): Promise<unknown>;
  unsubscribe(channel: string): Promise<unknown>;
  on(
    event: "message",
    listener: (channel: string, message: string) => void,
  ): unknown;
};

export type SubmissionEventBus = {
  /**
   * Registers a listener for a submission's events. Returns an idempotent
   * unsubscribe function.
   */
  subscribe(submissionId: string, listener: SubmissionListener): () => void;
};

/**
 * TTL for the version key. A contest burst can leave a submission queued
 * for many minutes; an expired key would degrade a pending stream to
 * the 30s DB fallback, so keep it for a full hour.
 */
export const SUBMISSION_VERSION_TTL_SECONDS = 3600;

export function submissionChannel(submissionId: string): string {
  return `${SUBMISSION_CHANNEL_PREFIX}${submissionId}`;
}

export function submissionVersionKey(submissionId: string): string {
  return `${SUBMISSION_CHANNEL_PREFIX}${submissionId}:version`;
}

/**
 * Pure parser for a Redis version value. Only non-negative integers
 * count as a version; a missing key, garbage, negatives or unsafe
 * numbers all mean "no version info" (null).
 */
export function parseSubmissionVersion(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Refcounted pub/sub fanout: one Redis SUBSCRIBE per submission channel,
 * however many SSE streams watch it. Subscriber/unsubscribe failures are
 * logged and never reject — SSE streams keep a fallback poll.
 */
export function createSubmissionEventBus(
  subscriber: RedisSubscriber,
): SubmissionEventBus {
  const listeners = new Map<string, Set<SubmissionListener>>();

  subscriber.on("message", (channel) => {
    if (!channel.startsWith(SUBMISSION_CHANNEL_PREFIX)) return;
    const set = listeners.get(channel.slice(SUBMISSION_CHANNEL_PREFIX.length));
    if (!set) return;
    for (const listener of set) {
      try {
        listener();
      } catch (error) {
        logger.warn("Submission event listener failed", {
          channel,
          error: errorMessage(error),
        });
      }
    }
  });

  const subscribe = (submissionId: string, listener: SubmissionListener) => {
    let set = listeners.get(submissionId);
    const needsChannel = !set || set.size === 0;
    if (!set) {
      set = new Set();
      listeners.set(submissionId, set);
    }
    set.add(listener);
    if (needsChannel) {
      subscriber.subscribe(submissionChannel(submissionId)).catch((error) => {
        // ioredis retries reconnects; until then SSE falls back to polling.
        logger.warn("Could not subscribe to submission events", {
          submissionId,
          error: errorMessage(error),
        });
      });
    }
    return () => {
      const current = listeners.get(submissionId);
      if (!current || !current.delete(listener)) return;
      if (current.size > 0) return;
      listeners.delete(submissionId);
      subscriber
        .unsubscribe(submissionChannel(submissionId))
        .catch((error) => {
          // Stray channel messages with no listeners are ignored upstream.
          logger.warn("Could not unsubscribe from submission events", {
            submissionId,
            error: errorMessage(error),
          });
        });
    };
  };

  return { subscribe };
}

type EventsCache = {
  bus: SubmissionEventBus;
};

const globalForEvents = globalThis as typeof globalThis & {
  __pauojSubmissionEvents?: EventsCache;
};

/** Process-wide bus on a dedicated subscriber connection. */
export function getSubmissionEventBus(): SubmissionEventBus {
  if (!globalForEvents.__pauojSubmissionEvents) {
    globalForEvents.__pauojSubmissionEvents = {
      bus: createSubmissionEventBus(getSubscriberRedis()),
    };
  }
  return globalForEvents.__pauojSubmissionEvents.bus;
}

/**
 * Minimal shared-client surface for the version read, so tests can
 * inject a fake without a real Redis connection.
 */
export type RedisVersionReader = {
  status: string;
  get(key: string): Promise<string | null>;
};

/**
 * Best-effort version read. Returns null on error, on a not-ready
 * connection, or when the value/missing key is not a usable version —
 * callers treat null as "rely on the DB fallback".
 */
export async function readSubmissionVersionWith(
  client: RedisVersionReader,
  submissionId: string,
): Promise<number | null> {
  try {
    if (client.status !== "ready") return null;
    return parseSubmissionVersion(
      await client.get(submissionVersionKey(submissionId)),
    );
  } catch {
    return null;
  }
}

export function readSubmissionEventVersion(
  submissionId: string,
): Promise<number | null> {
  return readSubmissionVersionWith(getRedis(), submissionId);
}

/**
 * Minimal shared-client surface for the publish pipeline, so tests can
 * inject a fake without a real Redis connection. Matches the ioredis
 * pipeline methods we depend on.
 */
export type RedisPublishPipeline = {
  incr(key: string): RedisPublishPipeline;
  expire(key: string, seconds: number): RedisPublishPipeline;
  publish(channel: string, message: string): RedisPublishPipeline;
  exec(): Promise<unknown>;
};

export type RedisPublisher = {
  status: string;
  multi(): RedisPublishPipeline;
};

/**
 * Best-effort verdict fanout, in one atomic MULTI: bump the version key
 * (SSE streams compare it to detect lost events), refresh its TTL, and
 * publish. Fire-and-forget on purpose: with maxRetriesPerRequest null
 * an outage would park the promise, and a judge result must never
 * depend on Redis. Call it only after the DB write commits.
 */
export function publishSubmissionChangedWith(
  client: RedisPublisher,
  submissionId: string,
): void {
  try {
    // Skip while the connection is down: offline commands would queue
    // unboundedly (maxRetriesPerRequest is null) and the SSE fallback
    // poll covers the missed event anyway.
    if (client.status !== "ready") return;
    const key = submissionVersionKey(submissionId);
    client
      .multi()
      .incr(key)
      .expire(key, SUBMISSION_VERSION_TTL_SECONDS)
      .publish(submissionChannel(submissionId), "changed")
      .exec()
      .catch((error: unknown) => {
        logger.warn("Could not publish submission event", {
          submissionId,
          error: errorMessage(error),
        });
      });
  } catch (error) {
    logger.warn("Could not publish submission event", {
      submissionId,
      error: errorMessage(error),
    });
  }
}

export function publishSubmissionChanged(submissionId: string): void {
  publishSubmissionChangedWith(getRedis(), submissionId);
}
