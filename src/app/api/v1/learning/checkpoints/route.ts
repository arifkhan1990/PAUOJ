import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { learningCheckpointStartSchema } from "@/lib/schemas/learning";
import { startLearningCheckpoint } from "@/server/services/learning";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = await parseJson(request, learningCheckpointStartSchema);
    const result = await startLearningCheckpoint(input.moduleSlug, user);
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
