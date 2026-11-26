import { describe, expect, it, vi } from "vitest";
import type { PublicAnnouncement } from "@/lib/notification-types";

const { listPublicAnnouncements } = vi.hoisted(() => ({
  listPublicAnnouncements: vi.fn(),
}));

vi.mock("./public-updates", () => ({ listPublicAnnouncements }));

const {
  DEFAULT_PUBLIC_ANNOUNCEMENTS_LIMIT,
  PUBLIC_ANNOUNCEMENTS_CACHE_CAPACITY,
  PUBLIC_ANNOUNCEMENTS_TTL_MS,
  createPublicAnnouncementsCache,
  getCachedPublicAnnouncements,
  publicAnnouncementsCacheKey,
} = await import("./public-announcements-cache");

function announcement(id: string): PublicAnnouncement {
  return {
    id,
    title: `Announcement ${id}`,
    body: "Body",
    href: null,
    createdAt: "2026-11-27T00:00:00.000Z",
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function clockedCache(options: { capacity?: number } = {}) {
  let now = 1_000;
  let loads = 0;
  const load = vi.fn(async (limit: number) => {
    loads += 1;
    return [announcement(`limit-${limit}-load-${loads}`)];
  });
  const cache = createPublicAnnouncementsCache({
    now: () => now,
    capacity: options.capacity,
    load,
  });
  return {
    cache,
    load,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("public announcement cache settings", () => {
  it("keeps announcements for 30s across at most 8 limit windows", () => {
    expect(PUBLIC_ANNOUNCEMENTS_TTL_MS).toBe(30_000);
    expect(PUBLIC_ANNOUNCEMENTS_CACHE_CAPACITY).toBe(8);
    expect(DEFAULT_PUBLIC_ANNOUNCEMENTS_LIMIT).toBe(10);
  });

  it("keys each drawer window separately", () => {
    expect(publicAnnouncementsCacheKey(10)).not.toBe(
      publicAnnouncementsCacheKey(20),
    );
  });
});

describe("createPublicAnnouncementsCache", () => {
  it("serves a fresh page without reloading", async () => {
    const { cache, load, advance } = clockedCache();

    const first = await cache.get(10);
    advance(PUBLIC_ANNOUNCEMENTS_TTL_MS - 1);
    const second = await cache.get(10);

    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(10);
    expect(second).toEqual(first);
  });

  it("reloads once the TTL has elapsed", async () => {
    const { cache, load, advance } = clockedCache();

    const first = await cache.get(10);
    advance(PUBLIC_ANNOUNCEMENTS_TTL_MS);
    const second = await cache.get(10);

    expect(load).toHaveBeenCalledTimes(2);
    expect(second).not.toEqual(first);
  });

  it("shares one load across concurrent misses on the same limit", async () => {
    const gate = deferred<void>();
    let loads = 0;
    const load = vi.fn(async (limit: number) => {
      loads += 1;
      await gate.promise;
      return [announcement(`limit-${limit}`)];
    });
    const cache = createPublicAnnouncementsCache({ load });

    const first = cache.get(10);
    const second = cache.get(10);
    expect(loads).toBe(1);

    gate.resolve();
    const [a, b] = await Promise.all([first, second]);
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(loads).toBe(1);
    expect(cache.size()).toBe(1);
  });

  it("evicts the oldest window once capacity is exceeded", async () => {
    const load = vi.fn(async (limit: number) => [announcement(`limit-${limit}`)]);
    const cache = createPublicAnnouncementsCache({ capacity: 2, load });

    await cache.get(1);
    await cache.get(2);
    await cache.get(3);
    expect(cache.size()).toBe(2);

    // 2 survived, 1 was the oldest and is gone.
    await cache.get(2);
    expect(load).toHaveBeenCalledTimes(3);
    await cache.get(1);
    expect(load).toHaveBeenCalledTimes(4);
  });

  it("returns a copy so a caller cannot mutate the cached array", async () => {
    const { cache, load } = clockedCache();

    const first = await cache.get(10);
    const second = await cache.get(10);
    expect(first).not.toBe(second);

    first.length = 0;
    first.push(announcement("mutated"));

    const third = await cache.get(10);
    expect(third).toHaveLength(1);
    expect(third[0]?.id).toBe("limit-10-load-1");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("maps the default and an explicit limit to one key", async () => {
    const { cache, load } = clockedCache();

    await cache.get();
    await cache.get(DEFAULT_PUBLIC_ANNOUNCEMENTS_LIMIT);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(DEFAULT_PUBLIC_ANNOUNCEMENTS_LIMIT);

    await cache.get(DEFAULT_PUBLIC_ANNOUNCEMENTS_LIMIT + 10);
    expect(load).toHaveBeenCalledTimes(2);
    expect(cache.size()).toBe(2);
  });

  it("clears a rejected load so the next request retries", async () => {
    const load = vi.fn(async (): Promise<PublicAnnouncement[]> => {
      throw new Error("db down");
    });
    const cache = createPublicAnnouncementsCache({ load });

    await expect(cache.get(10)).rejects.toThrow("db down");
    expect(cache.size()).toBe(0);

    load.mockResolvedValueOnce([announcement("recovered")]);
    await expect(cache.get(10)).resolves.toEqual([announcement("recovered")]);
  });
});

describe("getCachedPublicAnnouncements", () => {
  it("falls back to a direct read when the cache load fails", async () => {
    listPublicAnnouncements.mockReset();
    listPublicAnnouncements
      .mockRejectedValueOnce(new Error("db down"))
      .mockResolvedValueOnce([announcement("fallback")]);

    await expect(getCachedPublicAnnouncements(7)).resolves.toEqual([
      announcement("fallback"),
    ]);
    expect(listPublicAnnouncements).toHaveBeenCalledTimes(2);
    expect(listPublicAnnouncements).toHaveBeenCalledWith(7);
  });
});
