import type { ContestStatus } from "@/lib/contest-detail-types";

/**
 * In-process cache for the full ranked scoreboard.
 *
 * The cache stores whole snapshots (all rows), never per-page slices: every
 * page request for the same contest/admin view shares one DB load. TTLs are
 * short while a contest runs so live standings stay near-real-time.
 */

export const DEFAULT_STANDINGS_CACHE_CAPACITY = 4;

const TTL_MS: Record<ContestStatus, number> = {
  RUNNING: 5_000,
  UPCOMING: 5_000,
  ENDED: 30_000,
};

export function standingsTtlMs(status: ContestStatus): number {
  return TTL_MS[status];
}

/** Admins see the live board during freeze, so their view is never shared. */
export function standingsCacheKey(slug: string, isAdmin: boolean): string {
  return `${isAdmin ? "admin" : "public"}:${slug}`;
}

export type StandingsCacheEntry<T> = {
  value: T;
  /** Epoch ms when the snapshot finished loading. */
  generatedAt: number;
  /** Epoch ms after which the entry is stale. */
  expiresAt: number;
};

export type StandingsCacheStore<T> = {
  entries: Map<string, StandingsCacheEntry<T>>;
  inflight: Map<string, Promise<StandingsCacheEntry<T>>>;
  now: () => number;
  capacity: number;
};

export function createStandingsCacheStore<T>(options: {
  now?: () => number;
  capacity?: number;
} = {}): StandingsCacheStore<T> {
  return {
    entries: new Map(),
    inflight: new Map(),
    now: options.now ?? (() => Date.now()),
    capacity: Math.max(1, options.capacity ?? DEFAULT_STANDINGS_CACHE_CAPACITY),
  };
}

export type StandingsCacheLoad<T> = {
  value: T;
  /** How long this snapshot stays fresh from the moment it resolves. */
  ttlMs: number;
};

export type StandingsCache<T> = {
  /**
   * Returns the fresh snapshot for `key`, or loads it once. Concurrent misses
   * on the same key share the pending promise; a rejection clears it so the
   * next request retries immediately.
   */
  get(key: string, load: () => Promise<StandingsCacheLoad<T>>): Promise<StandingsCacheEntry<T>>;
  /** Number of stored (fresh or stale) entries; tests and diagnostics only. */
  size(): number;
};

function normalizeTtl(ttlMs: number): number {
  return Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : 0;
}

export function createStandingsCache<T>(
  store: StandingsCacheStore<T>,
): StandingsCache<T> {
  function isFresh(entry: StandingsCacheEntry<T>, now: number): boolean {
    return entry.expiresAt > now;
  }

  /** Oldest insertion wins: Map preserves insertion order. */
  function evictOverflow(): void {
    while (store.entries.size > store.capacity) {
      const oldest = store.entries.keys().next();
      if (oldest.done) return;
      store.entries.delete(oldest.value);
    }
  }

  async function get(
    key: string,
    load: () => Promise<StandingsCacheLoad<T>>,
  ): Promise<StandingsCacheEntry<T>> {
    const now = store.now();
    const cached = store.entries.get(key);
    if (cached && isFresh(cached, now)) return cached;
    // Drop the stale entry before loading so a failed load cannot resurrect it.
    if (cached) store.entries.delete(key);

    const pending = store.inflight.get(key);
    if (pending) return pending;

    const promise = load()
      .then((loaded) => {
        const generatedAt = store.now();
        const entry: StandingsCacheEntry<T> = {
          value: loaded.value,
          generatedAt,
          expiresAt: generatedAt + normalizeTtl(loaded.ttlMs),
        };
        // Re-insert so a refreshed key becomes the newest eviction candidate.
        store.entries.delete(key);
        store.entries.set(key, entry);
        evictOverflow();
        return entry;
      })
      .finally(() => {
        if (store.inflight.get(key) === promise) store.inflight.delete(key);
      });
    store.inflight.set(key, promise);
    return promise;
  }

  return {
    get,
    size: () => store.entries.size,
  };
}
