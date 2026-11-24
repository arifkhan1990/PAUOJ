import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestSponsorDecisionSchema } from "@/lib/schemas/contest-ops";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { reviewContestSponsorship } from "@/server/services/contest-sponsors";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; sponsorId: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    await enforceRateLimit(`contest:sponsor:review:${admin.id}`, 60, 60);
    const { id, sponsorId } = await context.params;
    const input = await parseJson(request, contestSponsorDecisionSchema);
    await reviewContestSponsorship(
      admin,
      id,
      sponsorId,
      input.decision,
      input.note ?? null,
    );
    await getDb().insert(auditLogs).values({
      actorId: admin.id,
      action: "contest.sponsor_review",
      entityType: "contest",
      entityId: id,
      metadata: { sponsorId, decision: input.decision },
    });
    return apiOk({ sponsorId, status: input.decision });
  } catch (error) {
    return apiError(error);
  }
}
