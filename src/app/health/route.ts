import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/constants";
import { getSql } from "@/server/db";
import { getMigrationStatus } from "@/server/db/migration-status";
import { pingRedis } from "@/server/redis";
import { getJudgeQueueCounts } from "@/server/judge/queue-health";
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
  let broadcastQueueCounts = { pending: 0, oldestPendingSeconds: 0 };
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
    // Broadcasts awaiting worker fan-out. A backlog is operational signal only;
    // it never flips the service to unhealthy. Missing table (pre-migration)
    // also degrades to 0.
    try {
      const [row] = await getSql()`
        select
          count(*) filter (where completed_at is null)::int as pending,
          coalesce(
            extract(epoch from now() - min(created_at) filter (where completed_at is null))::int,
            0
          ) as oldest_pending_seconds
        from broadcasts
      `;
      broadcastQueueCounts = {
        pending: Number(row?.pending ?? 0),
        oldestPendingSeconds: Number(row?.oldest_pending_seconds ?? 0),
      };
    } catch {
      broadcastQueueCounts = { pending: 0, oldestPendingSeconds: 0 };
    }
  }
  const redis = await pingRedis();
  let workers = 0;
  let judgeQueue = {
    waiting: 0,
    active: 0,
    prioritized: 0,
    delayed: 0,
    failed: 0,
  };
  if (redis) {
    try {
      workers = await getWorkerCount();
    } catch {
      workers = 0;
    }
    // Queue depth is operational signal only. It never flips `status` or the
    // HTTP code, and reads as zeros when Redis/BullMQ is unavailable.
    judgeQueue = await getJudgeQueueCounts();
  }
  const healthy = database && redis && (migrations?.ok ?? true);
  return NextResponse.json(
    {
      status: healthy && workers > 0 ? "ok" : "degraded",
      database,
      redis,
      migrations,
      emailOutbox: emailOutboxCounts,
      broadcastQueue: broadcastQueueCounts,
      judgeQueue,
      workers,
      version: APP_VERSION,
      commit: process.env.APP_COMMIT?.trim() || null,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  );
}
