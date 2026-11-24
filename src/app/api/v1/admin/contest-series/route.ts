import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestSeriesUpdateSchema } from "@/lib/schemas/contest-ops";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import {
  listContestSeries,
  updateContestSeries,
} from "@/server/services/contest-series";

export async function GET() {
  try {
    await requireApiAdmin();
    return apiOk(await listContestSeries());
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    await enforceRateLimit(`contest:series:update:${admin.id}`, 20, 60);
    const input = await parseJson(request, contestSeriesUpdateSchema);
    const series = await updateContestSeries(admin, input);
    await getDb().insert(auditLogs).values({
      actorId: admin.id,
      action: "contest.series_update",
      entityType: "contest_series",
      entityId: series[0]?.id ?? null,
      metadata: { ...input },
    });
    return apiOk(series);
  } catch (error) {
    return apiError(error);
  }
}
