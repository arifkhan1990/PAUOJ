import { describe, expect, it, vi } from "vitest";
import {
  createSubmissionEventBus,
  parseSubmissionVersion,
  publishSubmissionChangedWith,
  readSubmissionVersionWith,
  submissionChannel,
  submissionVersionKey,
  SUBMISSION_CHANNEL_PREFIX,
  SUBMISSION_VERSION_TTL_SECONDS,
  type RedisPublisher,
  type RedisSubscriber,
  type RedisVersionReader,
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

describe("submissionVersionKey", () => {
  it("namespaces the version key per submission id", () => {
    expect(submissionVersionKey("abc")).toBe("pauoj:submission:abc:version");
  });
});

describe("parseSubmissionVersion", () => {
  it("parses non-negative integers", () => {
    expect(parseSubmissionVersion("0")).toBe(0);
    expect(parseSubmissionVersion("42")).toBe(42);
    expect(parseSubmissionVersion("0007")).toBe(7);
  });

  it("rejects null, empty and non-numeric values", () => {
    expect(parseSubmissionVersion(null)).toBeNull();
    expect(parseSubmissionVersion("")).toBeNull();
    expect(parseSubmissionVersion("changed")).toBeNull();
    expect(parseSubmissionVersion("1.5")).toBeNull();
    expect(parseSubmissionVersion("1e3")).toBeNull();
    expect(parseSubmissionVersion(" 1")).toBeNull();
    expect(parseSubmissionVersion("+1")).toBeNull();
  });

  it("rejects negative and unsafe values", () => {
    expect(parseSubmissionVersion("-1")).toBeNull();
    expect(parseSubmissionVersion("9".repeat(40))).toBeNull();
  });
});

function createFakeReader(options: {
  status?: string;
  value?: string | null;
  error?: Error;
} = {}) {
  const get = vi.fn(async (): Promise<string | null> => {
    if (options.error) throw options.error;
    return options.value ?? null;
  });
  const client: RedisVersionReader = {
    status: options.status ?? "ready",
    get,
  };
  return { client, get };
}

describe("readSubmissionVersionWith", () => {
  it("reads and parses the version key when the client is ready", async () => {
    const { client, get } = createFakeReader({ value: "7" });

    await expect(readSubmissionVersionWith(client, "s1")).resolves.toBe(7);
    expect(get).toHaveBeenCalledWith(submissionVersionKey("s1"));
  });

  it("returns null when the key is missing or non-numeric", async () => {
    await expect(
      readSubmissionVersionWith(createFakeReader().client, "s1"),
    ).resolves.toBeNull();
    await expect(
      readSubmissionVersionWith(createFakeReader({ value: "oops" }).client, "s1"),
    ).resolves.toBeNull();
    await expect(
      readSubmissionVersionWith(createFakeReader({ value: "-2" }).client, "s1"),
    ).resolves.toBeNull();
  });

  it("returns null without a GET when the client is not ready", async () => {
    const { client, get } = createFakeReader({ status: "reconnecting" });

    await expect(readSubmissionVersionWith(client, "s1")).resolves.toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it("never rejects when the GET throws", async () => {
    const { client } = createFakeReader({ error: new Error("redis down") });

    await expect(readSubmissionVersionWith(client, "s1")).resolves.toBeNull();
  });
});

type FakePipeline = {
  incr(key: string): FakePipeline;
  expire(key: string, seconds: number): FakePipeline;
  publish(channel: string, message: string): FakePipeline;
  exec(): Promise<unknown>;
};

function createFakePublisher(options: {
  status?: string;
  execError?: Error;
  multiError?: Error;
} = {}) {
  const pipeline: FakePipeline = {
    incr: vi.fn((): FakePipeline => pipeline),
    expire: vi.fn((): FakePipeline => pipeline),
    publish: vi.fn((): FakePipeline => pipeline),
    exec: vi.fn((): Promise<unknown> =>
      options.execError
        ? Promise.reject(options.execError)
        : Promise.resolve([[null, 1], [null, 1], [null, 1]]),
    ),
  };
  const multi = vi.fn((): FakePipeline => {
    if (options.multiError) throw options.multiError;
    return pipeline;
  });
  const client: RedisPublisher = {
    status: options.status ?? "ready",
    multi,
  };
  return { client, multi, pipeline };
}

describe("publishSubmissionChangedWith", () => {
  it("increments the version, sets the TTL and publishes in one pipeline", () => {
    const { client, pipeline } = createFakePublisher();

    publishSubmissionChangedWith(client, "s1");

    expect(pipeline.incr).toHaveBeenCalledWith(submissionVersionKey("s1"));
    expect(pipeline.expire).toHaveBeenCalledWith(
      submissionVersionKey("s1"),
      SUBMISSION_VERSION_TTL_SECONDS,
    );
    expect(pipeline.publish).toHaveBeenCalledWith(
      submissionChannel("s1"),
      "changed",
    );
    expect(pipeline.exec).toHaveBeenCalledTimes(1);
  });

  it("skips the pipeline entirely when the client is not ready", () => {
    const { client, multi } = createFakePublisher({ status: "reconnecting" });

    publishSubmissionChangedWith(client, "s1");

    expect(multi).not.toHaveBeenCalled();
  });

  it("does not throw when the pipeline exec rejects", async () => {
    const { client } = createFakePublisher({
      execError: new Error("exec failed"),
    });

    expect(() => publishSubmissionChangedWith(client, "s1")).not.toThrow();
    await flush();
  });

  it("does not throw when multi() throws synchronously", () => {
    const { client } = createFakePublisher({
      multiError: new Error("multi failed"),
    });

    expect(() => publishSubmissionChangedWith(client, "s1")).not.toThrow();
  });
});
