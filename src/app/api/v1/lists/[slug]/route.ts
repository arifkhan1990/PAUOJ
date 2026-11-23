import type { NextRequest } from "next/server";
import {
  parseStudyListSlug,
  studyListInputSchema,
} from "@/lib/schemas/study-list";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import {
  deleteUserStudyListBySlug,
  updateUserStudyListBySlug,
} from "@/server/services/study-list-user";

function validatedSlug(value: string): string {
  const slug = parseStudyListSlug(value);
  if (!slug) throw errors.notFound("Study plan not found.");
  return slug;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`study:plan:update:${user.id}`, 20, 60);
    const { slug: rawSlug } = await context.params;
    const slug = validatedSlug(rawSlug);
    const input = await parseJson(request, studyListInputSchema);
    return apiOk(await updateUserStudyListBySlug(slug, user.id, input));
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`study:plan:delete:${user.id}`, 20, 60);
    const { slug: rawSlug } = await context.params;
    await deleteUserStudyListBySlug(validatedSlug(rawSlug), user.id);
    return apiOk({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
