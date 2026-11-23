import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiError, apiOk } from "@/server/api/responses";
import {
  enrollStudyList,
  leaveStudyList,
} from "@/server/services/study-lists";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/);

function validatedSlug(value: string): string {
  const parsed = slugSchema.safeParse(value);
  if (!parsed.success) throw errors.notFound("Study list not found.");
  return parsed.data;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`study:enroll:${user.id}`, 30, 60);
    const { slug } = await context.params;
    return apiOk(await enrollStudyList(validatedSlug(slug), user.id));
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
    await enforceRateLimit(`study:enroll:${user.id}`, 30, 60);
    const { slug } = await context.params;
    return apiOk(await leaveStudyList(validatedSlug(slug), user.id));
  } catch (error) {
    return apiError(error);
  }
}
