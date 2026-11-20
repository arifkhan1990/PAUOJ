import { getRedis } from "../redis";
import { ApiError } from "./errors";

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
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    const ttl = await redis.ttl(key);
    return {
      allowed: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch (error) {
    console.error("Rate limit unavailable; allowing request", error);
    return {
      allowed: true,
      limit,
      remaining: limit,
      retryAfterSeconds: 0,
    };
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
