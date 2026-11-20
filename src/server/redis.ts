import Redis from "ioredis";
import { getEnv } from "./env";

type RedisCache = {
  client: Redis;
};

const globalForRedis = globalThis as typeof globalThis & {
  __pauojRedis?: RedisCache;
};

export function getRedis(): Redis {
  if (!globalForRedis.__pauojRedis) {
    const client = new Redis(getEnv().REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    client.on("error", (error) => {
      console.error("Redis connection error", error.message);
    });
    globalForRedis.__pauojRedis = { client };
  }
  return globalForRedis.__pauojRedis.client;
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
}
