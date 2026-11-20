import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { problemContributionInputSchema } from "@/lib/schemas/problem-contribution";
import { createProblemContribution } from "@/server/services/problem-contributions";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const contributor = await requireApiUser();
    await enforceRateLimit(`problem:contribution:${contributor.id}`, 5, 60);
    const { slug } = await context.params;
    const input = await parseJson(request, problemContributionInputSchema);
    const created = await createProblemContribution(contributor, slug, input);
    await getDb().insert(auditLogs).values({
      actorId: contributor.id,
      action: "problem.contribution.create",
      entityType: "problem",
      entityId: created.problemId,
      metadata: { contributionId: created.id, kind: created.kind },
    });
    return apiCreated(created);
  } catch (error) {
    return apiError(error);
  }
}
