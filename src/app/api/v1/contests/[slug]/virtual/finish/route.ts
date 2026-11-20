import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { finishVirtualContest } from "@/server/services/virtual-contests";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { slug } = await context.params;
    await finishVirtualContest(slug, user.id);
    return apiOk({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
