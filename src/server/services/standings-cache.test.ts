import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_STANDINGS_CACHE_CAPACITY,
  createStandingsCache,
  createStandingsCacheStore,
  standingsCacheKey,
  standingsTtlMs,
} from "./standings-cache";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function clockedCache<T>(options: { capacity?: number } = {}) {
  let now = 1_000;
  const store = createStandingsCacheStore<T>({
    now: () => now,
    capacity: options.capacity,
  });
  return {
    cache: createStandingsCache(store),
    advance: (ms: number) => {
      now += ms;
    },
    at: (ms: number) => {
      now = ms;
    },
  };
}

describe("standingsCacheKey", () => {
  it("separates the admin board from the public board", () => {
    expect(standingsCacheKey("round-1", true)).not.toBe(
      standingsCacheKey("round-1", false),
    );
    expect(standingsCacheKey("round-a", false)).not.toBe(
      standingsCacheKey("round-b", false),
    );
  });
});

describe("standingsTtlMs", () => {
  it("keeps live boards short and final boards longer", () => {
    expect(standingsTtlMs("RUNNING")).toBe(5_000);
    expect(standingsTtlMs("UPCOMING")).toBe(5_000);
    expect(standingsTtlMs("ENDED")).toBe(30_000);
  });
});

describe("createStandingsCache", () => {
  it("serves a fresh snapshot without reloading", async () => {
    const { cache, advance } = clockedCache<string>();
    const load = vi.fn(async () => ({ value: "board", ttlMs: 5_000 }));

    await expect(cache.get("public:a", load)).resolves.toMatchObject({
      value: "board",
    });
    advance(4_999);
    await expect(cache.get("public:a", load)).resolves.toMatchObject({
      value: "board",
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("reloads once the TTL has elapsed", async () => {
    const { cache, at } = clockedCache<string>();
    let loads = 0;
    const load = async () => {
      loads += 1;
      return { value: `board-${loads}`, ttlMs: 5_000 };
    };

    await expect(cache.get("public:a", load)).resolves.toMatchObject({
      value: "board-1",
      generatedAt: 1_000,
      expiresAt: 6_000,
    });
    at(6_000);
    await expect(cache.get("public:a", load)).resolves.toMatchObject({
      value: "board-2",
      generatedAt: 6_000,
      expiresAt: 11_000,
    });
    expect(loads).toBe(2);
  });

  it("shares one load across concurrent misses on the same key", async () => {
    const { cache } = clockedCache<string>();
    const gate = deferred<void>();
    let loads = 0;
    const load = async () => {
      loads += 1;
      await gate.promise;
      return { value: "board", ttlMs: 5_000 };
    };

    const first = cache.get("public:a", load);
    const second = cache.get("public:a", load);
    expect(loads).toBe(1);

    gate.resolve();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
    expect(a.value).toBe("board");
    expect(loads).toBe(1);
    expect(cache.size()).toBe(1);
  });

  it("does not share loads across different keys", async () => {
    const { cache } = clockedCache<string>();
    const gate = deferred<void>();
    let loads = 0;
    const load = async () => {
      loads += 1;
      await gate.promise;
      return { value: "board", ttlMs: 5_000 };
    };

    const admin = cache.get(standingsCacheKey("round-1", true), load);
    const publicBoard = cache.get(standingsCacheKey("round-1", false), load);
    expect(loads).toBe(2);

    gate.resolve();
    await expect(Promise.all([admin, publicBoard])).resolves.toHaveLength(2);
    expect(cache.size()).toBe(2);
  });

  it("clears a rejected load so the next request retries", async () => {
    const { cache } = clockedCache<string>();
    const failing = vi.fn(async () => {
      throw new Error("db down");
    });

    const first = cache.get("public:a", failing);
    const second = cache.get("public:a", failing);
    await expect(first).rejects.toThrow("db down");
    await expect(second).rejects.toThrow("db down");
    expect(failing).toHaveBeenCalledTimes(1);
    expect(cache.size()).toBe(0);

    const load = vi.fn(async () => ({ value: "recovered", ttlMs: 5_000 }));
    await expect(cache.get("public:a", load)).resolves.toMatchObject({
      value: "recovered",
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("drops a stale entry when the refresh fails", async () => {
    const { cache, at } = clockedCache<string>();
    await cache.get("public:a", async () => ({ value: "old", ttlMs: 1_000 }));

    at(2_000);
    await expect(
      cache.get("public:a", async () => {
        throw new Error("db down");
      }),
    ).rejects.toThrow("db down");
    expect(cache.size()).toBe(0);

    await expect(
      cache.get("public:a", async () => ({ value: "new", ttlMs: 1_000 })),
    ).resolves.toMatchObject({ value: "new" });
  });

  it("evicts the oldest entry once capacity is exceeded", async () => {
    const { cache } = clockedCache<string>({ capacity: 2 });
    const loads = new Map<string, number>();
    const load = (value: string) => async () => {
      loads.set(value, (loads.get(value) ?? 0) + 1);
      return { value, ttlMs: 60_000 };
    };

    await cache.get("k:a", load("a"));
    await cache.get("k:b", load("b"));
    await cache.get("k:c", load("c"));
    expect(cache.size()).toBe(2);

    // b survived, a was the oldest and is gone.
    await expect(cache.get("k:b", load("b"))).resolves.toMatchObject({
      value: "b",
    });
    expect(loads.get("b")).toBe(1);
    await expect(cache.get("k:a", load("a"))).resolves.toMatchObject({
      value: "a",
    });
    expect(loads.get("a")).toBe(2);
  });

  it("caps the store at four entries by default", async () => {
    const { cache } = clockedCache<string>();
    expect(DEFAULT_STANDINGS_CACHE_CAPACITY).toBe(4);

    for (const key of ["a", "b", "c", "d", "e"]) {
      await cache.get(key, async () => ({ value: key, ttlMs: 60_000 }));
    }
    expect(cache.size()).toBe(4);
  });

  it("treats a non-positive TTL as immediately stale", async () => {
    const { cache } = clockedCache<string>();
    const load = vi.fn(async () => ({ value: "board", ttlMs: 0 }));

    await cache.get("public:a", load);
    await cache.get("public:a", load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
