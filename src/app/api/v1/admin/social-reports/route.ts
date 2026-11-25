import type { NextRequest } from "next/server";
import { requireApiAdmin } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { pageMeta, parseQuery } from "@/server/api/validation";
import { socialReportListQuerySchema } from "@/lib/schemas/social-report";
import {
  SOCIAL_REPORT_PAGE_SIZE,
  listSocialReports,
} from "@/server/services/social-report-admin";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireApiAdmin();
    await enforceRateLimit(`social-report:list:${admin.id}`, 120, 60);
    const query = parseQuery(request, socialReportListQuerySchema);
    const result = await listSocialReports({
      status: query.status,
      page: query.page,
    });
    return apiOk(
      result.items,
      pageMeta(result.total, {
        page: result.page,
        pageSize: SOCIAL_REPORT_PAGE_SIZE,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
