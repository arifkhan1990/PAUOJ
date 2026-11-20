import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { studyListInputSchema } from "@/lib/schemas/study-list";
import { updateStudyList } from "@/server/services/study-lists";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    await requireApiAdmin();
    const { id } = await context.params;
    const input = await parseJson(request, studyListInputSchema);
    const result = await updateStudyList(id, input);
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
