import type { NextRequest } from "next/server";
import { studyListInputSchema } from "@/lib/schemas/study-list";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { createUserStudyList } from "@/server/services/study-list-user";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`study:plan:create:${user.id}`, 20, 60);
    const input = await parseJson(request, studyListInputSchema);
    return apiCreated(await createUserStudyList(user.id, input));
  } catch (error) {
    return apiError(error);
  }
}
