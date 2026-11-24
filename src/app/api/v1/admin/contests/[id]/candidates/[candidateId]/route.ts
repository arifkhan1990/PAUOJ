import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestCandidateDecisionSchema } from "@/lib/schemas/contest-ops";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { decideContestCandidate } from "@/server/services/contest-staff";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; candidateId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:candidate:decide:${user.id}`, 60, 60);
    const { id, candidateId } = await context.params;
    const input = await parseJson(request, contestCandidateDecisionSchema);
    await decideContestCandidate(user, id, candidateId, input.status);
    await getDb().insert(auditLogs).values({
      actorId: user.id,
      action: "contest.candidate_decide",
      entityType: "contest",
      entityId: id,
      metadata: { candidateId, status: input.status },
    });
    return apiOk({ status: input.status });
  } catch (error) {
    return apiError(error);
  }
}
