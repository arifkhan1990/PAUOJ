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

export function submissionChannel(submissionId: string): string {
  return `${SUBMISSION_CHANNEL_PREFIX}${submissionId}`;
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
 * Best-effort verdict fanout. Fire-and-forget on purpose: with
 * maxRetriesPerRequest null an outage would park the promise, and a judge
 * result must never depend on Redis. Call it only after the DB write commits.
 */
export function publishSubmissionChanged(submissionId: string): void {
  getRedis()
    .publish(submissionChannel(submissionId), "changed")
    .catch((error) => {
      logger.warn("Could not publish submission event", {
        submissionId,
        error: errorMessage(error),
      });
    });
}
