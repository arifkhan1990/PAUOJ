import { getRedis } from "../redis";
import { ApiError } from "./errors";

type LocalEntry = { count: number; resetAt: number };

/** Last-resort per-instance limiter used when Redis is unavailable. */
const localWindows = new Map<string, LocalEntry>();

function localRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const existing = localWindows.get(key);
  if (!existing || existing.resetAt <= now) {
    localWindows.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    if (localWindows.size > 5_000) {
      for (const [entryKey, entry] of localWindows) {
        if (entry.resetAt <= now) localWindows.delete(entryKey);
      }
    }
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: windowSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    ),
  };
}

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const redis = getRedis();
    // INCR + EXPIRE is atomic here: a connection drop between the two commands
    // must never leave a counter without a TTL (which would lock the bucket).
    const reply = (await redis.eval(
      `local current = redis.call('INCR', KEYS[1])
       if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
       local ttl = redis.call('TTL', KEYS[1])
       if ttl < 0 then
         redis.call('EXPIRE', KEYS[1], ARGV[1])
         ttl = tonumber(ARGV[1])
       end
       return {current, ttl}`,
      1,
      key,
      String(windowSeconds),
    )) as [number | string, number | string];
    const count = Number(reply[0] ?? 0);
    const ttl = Number(reply[1] ?? windowSeconds);
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch (error) {
    console.error("Rate limit unavailable; using local fallback", error);
    return localRateLimit(key, limit, windowSeconds);
  }
}

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  message?: string,
): Promise<void> {
  const result = await rateLimit(key, limit, windowSeconds);
  if (!result.allowed) {
    throw new ApiError(
      "RATE_LIMITED",
      message ?? "Too many requests. Please wait and try again.",
      429,
      { retryAfterSeconds: result.retryAfterSeconds },
    );
  }
}
