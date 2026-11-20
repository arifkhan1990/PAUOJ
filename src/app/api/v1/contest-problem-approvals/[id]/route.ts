import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestApprovalDecisionSchema } from "@/lib/schemas/contest-approval";
import { decideContestProblemApproval } from "@/server/services/contest-problem-approvals";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const reviewer = await requireApiUser();
    await enforceRateLimit(`contest:approval:${reviewer.id}`, 30, 60);
    const { id } = await context.params;
    const input = await parseJson(request, contestApprovalDecisionSchema);
    const updated = await decideContestProblemApproval(reviewer, id, input);
    await getDb().insert(auditLogs).values({
      actorId: reviewer.id,
      action: `contest.approval.${input.action}`,
      entityType: "contest",
      entityId: updated.contestId,
      metadata: {
        approvalId: updated.id,
        problemId: updated.problemId,
      },
    });
    return apiOk(updated);
  } catch (error) {
    return apiError(error);
  }
}
