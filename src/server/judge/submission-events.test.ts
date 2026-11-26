import { describe, expect, it, vi } from "vitest";
import {
  createSubmissionEventBus,
  submissionChannel,
  SUBMISSION_CHANNEL_PREFIX,
  type RedisSubscriber,
} from "./submission-events";

function createFakeSubscriber() {
  const channels = new Set<string>();
  const messageListeners: Array<(channel: string, message: string) => void> = [];
  let failSubscribe = false;
  let failUnsubscribe = false;
  const subscriber: RedisSubscriber = {
    subscribe: vi.fn(async (channel: string): Promise<void> => {
      if (failSubscribe) throw new Error("subscribe failed");
      channels.add(channel);
    }),
    unsubscribe: vi.fn(async (channel: string): Promise<void> => {
      if (failUnsubscribe) throw new Error("unsubscribe failed");
      channels.delete(channel);
    }),
    on: vi.fn(
      (
        _event: "message",
        listener: (channel: string, message: string) => void,
      ): void => {
        messageListeners.push(listener);
      },
    ),
  };
  return {
    subscriber,
    failSubscribe: () => {
      failSubscribe = true;
    },
    failUnsubscribe: () => {
      failUnsubscribe = true;
    },
    emit: (channel: string, message = "changed") => {
      for (const listener of messageListeners) listener(channel, message);
    },
    subscribedChannels: () => [...channels],
  };
}

/** Flushes rejected subscribe/unsubscribe promises so failures surface. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe("createSubmissionEventBus", () => {
  it("subscribes once per channel and refcounts listeners", () => {
    const { subscriber, subscribedChannels } = createFakeSubscriber();
    const bus = createSubmissionEventBus(subscriber);

    const first = bus.subscribe("s1", vi.fn());
    const second = bus.subscribe("s1", vi.fn());

    expect(subscriber.subscribe).toHaveBeenCalledTimes(1);
    expect(subscriber.subscribe).toHaveBeenCalledWith(submissionChannel("s1"));
    expect(subscribedChannels()).toEqual([submissionChannel("s1")]);

    first();
    expect(subscriber.unsubscribe).not.toHaveBeenCalled();

    second();
    expect(subscriber.unsubscribe).toHaveBeenCalledTimes(1);
    expect(subscribedChannels()).toEqual([]);
  });

  it("fans messages out to all listeners of the matching submission", () => {
    const { subscriber, emit } = createFakeSubscriber();
    const bus = createSubmissionEventBus(subscriber);
    const a1 = vi.fn();
    const a2 = vi.fn();
    const b1 = vi.fn();
    bus.subscribe("s1", a1);
    bus.subscribe("s1", a2);
    bus.subscribe("s2", b1);

    emit(submissionChannel("s1"));

    expect(a1).toHaveBeenCalledTimes(1);
    expect(a2).toHaveBeenCalledTimes(1);
    expect(b1).not.toHaveBeenCalled();
  });

  it("ignores channels outside the submission namespace", () => {
    const { subscriber, emit } = createFakeSubscriber();
    const bus = createSubmissionEventBus(subscriber);
    const listener = vi.fn();
    bus.subscribe("s1", listener);

    emit("pauoj:other:s1");

    expect(listener).not.toHaveBeenCalled();
  });

  it("isolates listener failures from other listeners", () => {
    const { subscriber, emit } = createFakeSubscriber();
    const bus = createSubmissionEventBus(subscriber);
    const boom = vi.fn(() => {
      throw new Error("listener bug");
    });
    const ok = vi.fn();
    bus.subscribe("s1", boom);
    bus.subscribe("s1", ok);

    expect(() => emit(submissionChannel("s1"))).not.toThrow();
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it("keeps the unsubscribe function idempotent", () => {
    const { subscriber } = createFakeSubscriber();
    const bus = createSubmissionEventBus(subscriber);
    const unlisten = bus.subscribe("s1", vi.fn());

    unlisten();
    unlisten();

    expect(subscriber.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("re-subscribes after all listeners leave and one returns", () => {
    const { subscriber } = createFakeSubscriber();
    const bus = createSubmissionEventBus(subscriber);
    const unlisten = bus.subscribe("s1", vi.fn());
    unlisten();
    const unlistenAgain = bus.subscribe("s1", vi.fn());

    expect(subscriber.subscribe).toHaveBeenCalledTimes(2);
    unlistenAgain();
    expect(subscriber.unsubscribe).toHaveBeenCalledTimes(2);
  });

  it("does not crash when the Redis subscribe fails", async () => {
    const { subscriber, failSubscribe } = createFakeSubscriber();
    failSubscribe();
    const bus = createSubmissionEventBus(subscriber);
    const listener = vi.fn();

    expect(() => {
      const unlisten = bus.subscribe("s1", listener);
      unlisten();
    }).not.toThrow();
    await flush();
  });

  it("does not crash when the Redis unsubscribe fails", async () => {
    const { subscriber, failUnsubscribe, emit } = createFakeSubscriber();
    const bus = createSubmissionEventBus(subscriber);
    const unlisten = bus.subscribe("s1", vi.fn());

    failUnsubscribe();
    expect(() => unlisten()).not.toThrow();
    await flush();

    // A stale channel message with no registered listener is a no-op.
    expect(() => emit(submissionChannel("s1"))).not.toThrow();
  });
});

describe("submissionChannel", () => {
  it("namespaces channels per submission id", () => {
    expect(submissionChannel("abc")).toBe(`${SUBMISSION_CHANNEL_PREFIX}abc`);
  });
});
