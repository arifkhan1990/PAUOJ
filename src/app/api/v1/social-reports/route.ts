import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { createSocialReportSchema } from "@/lib/schemas/social-report";
import { createSocialReport } from "@/server/services/social-reports";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = await parseJson(request, createSocialReportSchema);
    const result = await createSocialReport(user, input);
    return apiCreated(result);
  } catch (error) {
    return apiError(error);
  }
}
