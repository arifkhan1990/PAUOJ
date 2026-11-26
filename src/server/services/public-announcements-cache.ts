import type { PublicAnnouncement } from "@/lib/notification-types";
import { logger } from "@/server/logger";
import { listPublicAnnouncements } from "./public-updates";
import {
  createStandingsCache,
  createStandingsCacheStore,
  type StandingsCacheStore,
} from "./standings-cache";

/**
 * Process-local cache for the public announcement drawer.
 *
 * Ten thousand guests opening the navbar drawer in one burst would otherwise
 * run one identical query each. A 30s TTL collapses that burst into a single
 * load; `limit` is part of the cache key because each drawer window asks for a
 * different page size. The TTL + single-flight store is the same generic
 * implementation the live scoreboard uses, so concurrent misses cannot
 * stampede the database.
 */
export const PUBLIC_ANNOUNCEMENTS_TTL_MS = 30_000;
export const PUBLIC_ANNOUNCEMENTS_CACHE_CAPACITY = 8;
/** Matches the default drawer page size of `listPublicAnnouncements`. */
export const DEFAULT_PUBLIC_ANNOUNCEMENTS_LIMIT = 10;

export function publicAnnouncementsCacheKey(limit: number): string {
  return `limit:${limit}`;
}

function resolveLimit(limit?: number): number {
  return typeof limit === "number" && Number.isFinite(limit)
    ? Math.trunc(limit)
    : DEFAULT_PUBLIC_ANNOUNCEMENTS_LIMIT;
}

export type PublicAnnouncementsCache = {
  get(limit?: number): Promise<PublicAnnouncement[]>;
  /** Stored entries; tests and diagnostics only. */
  size(): number;
};

export function createPublicAnnouncementsCache(
  options: {
    now?: () => number;
    capacity?: number;
    load?: (limit: number) => Promise<PublicAnnouncement[]>;
  } = {},
): PublicAnnouncementsCache {
  const load = options.load ?? listPublicAnnouncements;
  const store: StandingsCacheStore<PublicAnnouncement[]> =
    createStandingsCacheStore({
      now: options.now,
      capacity: options.capacity ?? PUBLIC_ANNOUNCEMENTS_CACHE_CAPACITY,
    });
  const cache = createStandingsCache(store);

  return {
    async get(limit) {
      const resolved = resolveLimit(limit);
      const entry = await cache.get(
        publicAnnouncementsCacheKey(resolved),
        async () => ({
          value: await load(resolved),
          ttlMs: PUBLIC_ANNOUNCEMENTS_TTL_MS,
        }),
      );
      // Shallow copy per caller: a JSON serialiser or caller mutation must never
      // touch the array held by the cache. The rows themselves are immutable
      // DTOs assembled from SQL.
      return entry.value.slice();
    },
    size: () => cache.size(),
  };
}

// Dev hot reload re-evaluates modules; keep one store per process.
const globalForPublicAnnouncements = globalThis as typeof globalThis & {
  __pauojPublicAnnouncementsCache?: PublicAnnouncementsCache;
};

function publicAnnouncementsCache(): PublicAnnouncementsCache {
  return (globalForPublicAnnouncements.__pauojPublicAnnouncementsCache ??=
    createPublicAnnouncementsCache());
}

/**
 * Cached public feed used by the drawer route. A cache/loader failure degrades
 * to a direct read instead of failing the public route; the next request
 * retries the cache.
 */
export async function getCachedPublicAnnouncements(
  limit?: number,
): Promise<PublicAnnouncement[]> {
  try {
    return await publicAnnouncementsCache().get(limit);
  } catch (error) {
    logger.warn("Public announcement cache unavailable; reading directly", {
      error: error instanceof Error ? error.message : String(error),
    });
    return listPublicAnnouncements(limit);
  }
}
