import type { NextRequest } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getClientIp } from "@/server/api/request";
import { apiError, apiOk } from "@/server/api/responses";
import { parseQuery } from "@/server/api/validation";
import { getCachedPublicAnnouncements } from "@/server/services/public-announcements-cache";

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
    const ip = getClientIp(request) ?? "unknown";
    // 10k guests behind one campus/carrier NAT opening the drawer within a
    // minute is ~167/s, so the per-egress ceiling is high. The 30s TTL cache
    // makes that ceiling cheap (at most one DB read per window), while the
    // global cap still bounds a single client rotating X-Forwarded-For keys.
    await enforceRateLimit(`announcements:ip:${ip}`, 12_000, 60);
    await enforceRateLimit("announcements:global", 30_000, 60);
    const { limit } = parseQuery(request, announcementsQuerySchema);
    const response = apiOk(await getCachedPublicAnnouncements(limit));
    response.headers.set(
      "Cache-Control",
      "public, max-age=60, stale-while-revalidate=300",
    );
    return response;
  } catch (error) {
    return apiError(error);
  }
}
