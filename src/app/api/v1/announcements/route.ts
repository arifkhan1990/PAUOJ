import type { NextRequest } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getClientIp } from "@/server/api/request";
import { apiError, apiOk } from "@/server/api/responses";
import { parseQuery } from "@/server/api/validation";
import { listPublicAnnouncements } from "@/server/services/public-updates";

const announcementsQuerySchema = z.object({
  limit: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() !== "" ? value : undefined,
    z.coerce.number().int().min(1).max(20).default(10),
  ),
});

/** Public announcement feed for the navbar drawer; no session required. */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    // Global backstop: X-Forwarded-For is proxy-controlled and must not let one
    // client rotate keys for unlimited DB-backed reads.
    await enforceRateLimit("announcements:global", 1200, 60);
    await enforceRateLimit(`announcements:${ip ?? "unknown"}`, 60, 60);
    const { limit } = parseQuery(request, announcementsQuerySchema);
    const response = apiOk(await listPublicAnnouncements(limit));
    response.headers.set(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=300",
    );
    return response;
  } catch (error) {
    return apiError(error);
  }
}
