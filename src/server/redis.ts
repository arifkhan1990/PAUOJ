import Redis from "ioredis";
import { getEnv } from "./env";

type RedisCache = {
  client: Redis;
};

const globalForRedis = globalThis as typeof globalThis & {
  __pauojRedis?: RedisCache;
  __pauojRedisSubscriber?: Redis;
};

function createRedisClient(): Redis {
  return new Redis(getEnv().REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });
}

export function getRedis(): Redis {
  if (!globalForRedis.__pauojRedis) {
    const client = createRedisClient();
    client.on("error", (error) => {
      console.error("Redis connection error", error.message);
    });
    globalForRedis.__pauojRedis = { client };
  }
  return globalForRedis.__pauojRedis.client;
}

/**
 * Dedicated pub/sub connection. The shared command client cannot enter
 * subscriber mode, so event listeners get their own connection (created
 * lazily on the first subscription).
 */
export function getSubscriberRedis(): Redis {
  if (!globalForRedis.__pauojRedisSubscriber) {
    const subscriber = createRedisClient();
    subscriber.on("error", (error) => {
      console.error("Redis subscriber connection error", error.message);
    });
    globalForRedis.__pauojRedisSubscriber = subscriber;
  }
  return globalForRedis.__pauojRedisSubscriber;
}

export async function pingRedis(): Promise<boolean> {
  try {
    const result = await getRedis().ping();
    return result === "PONG";
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (globalForRedis.__pauojRedis) {
    await globalForRedis.__pauojRedis.client.quit();
    globalForRedis.__pauojRedis = undefined;
  }
  if (globalForRedis.__pauojRedisSubscriber) {
    await globalForRedis.__pauojRedisSubscriber.quit();
    globalForRedis.__pauojRedisSubscriber = undefined;
  }
}
