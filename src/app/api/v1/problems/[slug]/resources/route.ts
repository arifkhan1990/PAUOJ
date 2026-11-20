import type { NextRequest } from "next/server";
import {
  assertSameOrigin,
  optionalApiUser,
  requireApiUser,
} from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { problemResourceSchema } from "@/lib/schemas/problem-extras";
import {
  createProblemResource,
  getProblemResources,
} from "@/server/services/problem-extras";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const viewer = await optionalApiUser();
    const resources = await getProblemResources(slug, viewer);
    return apiOk(resources);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`problem:resource:${user.id}`, 10, 60);
    const { slug } = await context.params;
    const input = await parseJson(request, problemResourceSchema);
    const resource = await createProblemResource(slug, user, input);
    return apiCreated(resource);
  } catch (error) {
    return apiError(error);
  }
}
