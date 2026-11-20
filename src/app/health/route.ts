import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/constants";
import { getSql } from "@/server/db";
import { pingRedis } from "@/server/redis";
import { getWorkerCount } from "@/server/worker-heartbeat";

export const dynamic = "force-dynamic";

export async function GET() {
  let database = false;
  try {
    await getSql()`select 1`;
    database = true;
  } catch {
    database = false;
  }
  const redis = await pingRedis();
  let workers = 0;
  if (redis) {
    try {
      workers = await getWorkerCount();
    } catch {
      workers = 0;
    }
  }
  const healthy = database && redis;
  return NextResponse.json(
    {
      status: healthy && workers > 0 ? "ok" : "degraded",
      database,
      redis,
      workers,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
