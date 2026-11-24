import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { ensureMonthlyContestSeries } from "@/server/services/contest-series";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    await enforceRateLimit(`contest:series:ensure:${admin.id}`, 10, 60);
    const result = await ensureMonthlyContestSeries();
    await getDb().insert(auditLogs).values({
      actorId: admin.id,
      action: "contest.series_ensure",
      entityType: "contest",
      entityId: result.contestId,
      metadata: { created: result.created, startAt: result.startAt },
    });
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
