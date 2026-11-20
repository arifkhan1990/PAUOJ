import type { NextRequest } from "next/server";
import { optionalApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { apiError, apiOk } from "@/server/api/responses";
import { getProblemBySlug } from "@/server/services/problems";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const user = await optionalApiUser();
    const problem = await getProblemBySlug(
      slug,
      user?.id ?? null,
      user?.role === "ADMIN",
    );
    if (!problem) throw errors.notFound("Problem not found.");
    return apiOk(problem);
  } catch (error) {
    return apiError(error);
  }
}
