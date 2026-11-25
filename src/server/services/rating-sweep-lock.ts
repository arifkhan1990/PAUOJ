import { randomUUID } from "node:crypto";
import { getRedis } from "@/server/redis";

export const RATING_SWEEP_LOCK_KEY = "pauoj:rating-sweep:lock";
/** Longer than the 60s worker tick and a slow batch sweep. */
export const RATING_SWEEP_LOCK_TTL_MS = 300_000;

/**
 * Compare-and-delete: only the replica that owns the token may release. Stale
 * locks expire via the PX TTL if a worker dies mid-sweep.
 */
export const RATING_SWEEP_RELEASE_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

export function ratingSweepLockValue(): string {
  return randomUUID();
}

/** `SET key value NX PX ttl`: at most one replica wins per TTL window. */
export async function acquireRatingSweepLock(value: string): Promise<boolean> {
  const result = await getRedis().set(
    RATING_SWEEP_LOCK_KEY,
    value,
    "PX",
    RATING_SWEEP_LOCK_TTL_MS,
    "NX",
  );
  return result === "OK";
}

export async function releaseRatingSweepLock(value: string): Promise<void> {
  await getRedis().eval(
    RATING_SWEEP_RELEASE_SCRIPT,
    1,
    RATING_SWEEP_LOCK_KEY,
    value,
  );
}
