import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { studyListInputSchema } from "@/lib/schemas/study-list";
import { createStudyList } from "@/server/services/study-lists";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    const input = await parseJson(request, studyListInputSchema);
    const result = await createStudyList(admin.id, input);
    return apiCreated(result);
  } catch (error) {
    return apiError(error);
  }
}
