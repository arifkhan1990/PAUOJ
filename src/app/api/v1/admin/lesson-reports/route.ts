import type { NextRequest } from "next/server";
import { requireApiAdmin } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { pageMeta, parseQuery } from "@/server/api/validation";
import { lessonReportQuerySchema } from "@/lib/schemas/lesson-report";
import {
  LESSON_REPORT_PAGE_SIZE,
  listLessonReports,
} from "@/server/services/lesson-moderation";

export async function GET(request: NextRequest) {
  try {
    await requireApiAdmin();
    const query = parseQuery(request, lessonReportQuerySchema);
    const result = await listLessonReports({
      status: query.status,
      page: query.page,
    });
    return apiOk(
      result.items,
      pageMeta(result.total, {
        page: query.page,
        pageSize: LESSON_REPORT_PAGE_SIZE,
      }),
    );
  } catch (error) {
    return apiError(error);
  }
}
