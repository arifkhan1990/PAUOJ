import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { deleteLessonComment } from "@/server/services/lesson-discussions";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ module: string; topic: string; id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { module, topic, id } = await context.params;
    await deleteLessonComment(module, topic, user, id);
    return apiOk({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
