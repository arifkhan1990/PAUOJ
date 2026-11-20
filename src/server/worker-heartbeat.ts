import os from "node:os";
import { getRedis } from "./redis";

const WORKERS_KEY = "pauoj:workers";
const STALE_AFTER_MS = 90_000;

export async function recordWorkerHeartbeat(): Promise<void> {
  const redis = getRedis();
  const now = Date.now();
  await redis.zadd(WORKERS_KEY, now, os.hostname());
  await redis.zremrangebyscore(WORKERS_KEY, 0, now - STALE_AFTER_MS);
}

export async function clearWorkerHeartbeat(): Promise<void> {
  await getRedis().zrem(WORKERS_KEY, os.hostname());
}

export async function getWorkerCount(): Promise<number> {
  const redis = getRedis();
  const now = Date.now();
  await redis.zremrangebyscore(WORKERS_KEY, 0, now - STALE_AFTER_MS);
  return redis.zcard(WORKERS_KEY);
}
