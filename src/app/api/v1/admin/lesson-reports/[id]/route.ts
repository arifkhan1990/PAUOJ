import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { resolveLessonReportSchema } from "@/lib/schemas/lesson-report";
import { resolveLessonReport } from "@/server/services/lesson-moderation";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    await enforceRateLimit(`lesson:report:resolve:${admin.id}`, 30, 60);
    const { id } = await context.params;
    await parseJson(request, resolveLessonReportSchema);
    return apiOk(await resolveLessonReport(id, admin));
  } catch (error) {
    return apiError(error);
  }
}
