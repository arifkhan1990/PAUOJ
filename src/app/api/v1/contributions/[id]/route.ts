import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contributionDecisionSchema } from "@/lib/schemas/problem-contribution";
import { decideProblemContribution } from "@/server/services/problem-contributions";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const reviewer = await requireApiUser();
    await enforceRateLimit(`problem:contribution:review:${reviewer.id}`, 30, 60);
    const { id } = await context.params;
    const input = await parseJson(request, contributionDecisionSchema);
    const result = await decideProblemContribution(reviewer, id, input);
    const updated = result.item;
    await getDb().insert(auditLogs).values({
      actorId: reviewer.id,
      action: `problem.contribution.${input.action}`,
      entityType: "problem",
      entityId: updated.problemId,
      metadata: {
        contributionId: updated.id,
        kind: updated.kind,
        reviewedById: reviewer.id,
        ...(input.action === "approve" && updated.kind === "TESTS"
          ? { rejudge: input.rejudge, rejudged: result.rejudged }
          : {}),
      },
    });
    return apiOk({
      ...updated,
      rejudged: result.rejudged,
      rejudgeFailed: result.rejudgeFailed,
    });
  } catch (error) {
    return apiError(error);
  }
}
