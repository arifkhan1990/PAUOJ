import type { NextRequest } from "next/server";
import { optionalApiUser } from "@/server/api/auth";
import { errors } from "@/server/api/errors";
import { apiError, apiOk } from "@/server/api/responses";
import { getContestBySlug } from "@/server/services/contests";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const user = await optionalApiUser();
    const contest = await getContestBySlug(
      slug,
      user?.id ?? null,
      user?.role === "ADMIN",
    );
    if (!contest) throw errors.notFound("Contest not found.");
    return apiOk(contest);
  } catch (error) {
    return apiError(error);
  }
}
