import type { NextRequest } from "next/server";
import { optionalApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { getScoreboard } from "@/server/services/contests";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const user = await optionalApiUser();
    const scoreboard = await getScoreboard(slug, user?.role === "ADMIN");
    return apiOk(scoreboard);
  } catch (error) {
    return apiError(error);
  }
}
