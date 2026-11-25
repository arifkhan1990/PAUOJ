import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { socialReportResolutionSchema } from "@/lib/schemas/social-report";
import { resolveSocialReport } from "@/server/services/social-report-admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    await enforceRateLimit(`social-report:resolve:${admin.id}`, 60, 60);
    const { id } = await context.params;
    const input = await parseJson(request, socialReportResolutionSchema);
    return apiOk(
      await resolveSocialReport(admin.id, id, {
        status: input.status,
        note: input.note,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
