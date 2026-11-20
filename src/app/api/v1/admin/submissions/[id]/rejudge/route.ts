import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiAdmin } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { rejudgeSubmission } from "@/server/services/submissions";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const admin = await requireApiAdmin();
    const { id } = await context.params;
    await rejudgeSubmission(admin.id, id);
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
