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
  let emailOutboxCounts = { pending: 0, failed: 0 };
  if (database) {
    try {
      const [row] = await getSql()`
        select
          count(*) filter (where status = 'PENDING')::int as pending,
          count(*) filter (where status = 'FAILED')::int as failed
        from email_outbox
      `;
      emailOutboxCounts = {
        pending: Number(row?.pending ?? 0),
        failed: Number(row?.failed ?? 0),
      };
    } catch {
      emailOutboxCounts = { pending: 0, failed: 0 };
    }
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
  const healthy = database && redis && (migrations?.ok ?? true);
  return NextResponse.json(
    {
      status: healthy && workers > 0 ? "ok" : "degraded",
      database,
      redis,
      migrations,
      emailOutbox: emailOutboxCounts,
      workers,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
