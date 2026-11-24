import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestHostDecisionSchema } from "@/lib/schemas/contest-ops";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import {
  convertContestHostRequest,
  reviewContestHostRequest,
} from "@/server/services/contest-host-requests";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    await enforceRateLimit(`contest:host:review:${admin.id}`, 60, 60);
    const { id } = await context.params;
    const input = await parseJson(request, contestHostDecisionSchema);

    if (input.decision === "CONVERTED") {
      const converted = await convertContestHostRequest(admin, id);
      await getDb().insert(auditLogs).values({
        actorId: admin.id,
        action: "contest.host_review",
        entityType: "contest_host_request",
        entityId: id,
        metadata: {
          decision: "CONVERTED",
          contestId: converted.contestId,
          slug: converted.slug,
        },
      });
      return apiOk({
        status: "CONVERTED",
        contestId: converted.contestId,
        slug: converted.slug,
      });
    }

    const updated = await reviewContestHostRequest(
      admin,
      id,
      input.decision,
      input.note ?? null,
    );
    await getDb().insert(auditLogs).values({
      actorId: admin.id,
      action: "contest.host_review",
      entityType: "contest_host_request",
      entityId: id,
      metadata: { decision: input.decision },
    });
    return apiOk(updated);
  } catch (error) {
    return apiError(error);
  }
}
