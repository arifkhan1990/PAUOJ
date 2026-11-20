import type { NextRequest } from "next/server";
import { requireApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { apiError, apiOk } from "@/server/api/responses";
import { getRun } from "@/server/services/runs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser();
    const { id } = await context.params;
    const result = await getRun(user.id, id);
    if (!result) throw errors.notFound("Run not found or expired.");
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
