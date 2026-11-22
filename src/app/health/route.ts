import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/constants";
import { getSql } from "@/server/db";
import { getMigrationStatus } from "@/server/db/migration-status";
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
  const migrations = await getMigrationStatus();
  const redis = await pingRedis();
  let workers = 0;
  if (redis) {
    try {
      workers = await getWorkerCount();
    } catch {
      workers = 0;
    }
  }
  const healthy = database && redis && (migrations?.ok ?? true);
  return NextResponse.json(
    {
      status: healthy && workers > 0 ? "ok" : "degraded",
      database,
      redis,
      migrations,
      workers,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
