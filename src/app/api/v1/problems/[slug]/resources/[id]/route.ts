import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { deleteProblemResource } from "@/server/services/problem-extras";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`problem:resource-delete:${user.id}`, 20, 60);
    const { slug, id } = await context.params;
    await deleteProblemResource(slug, user, id);
    return apiOk({ id });
  } catch (error) {
    return apiError(error);
  }
}
