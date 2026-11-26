import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { optionalApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import { parseQuery } from "@/server/api/validation";
import { getScoreboard } from "@/server/services/contests";
import { scoreboardEtag } from "@/server/services/scoreboard-etag";
import {
  SCOREBOARD_DEFAULT_PAGE_SIZE,
  SCOREBOARD_MAX_PAGE_SIZE,
} from "@/lib/contest-detail-types";

/** Blank query values mean "use the default" instead of coercing to 0. */
function blankToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

const standingsQuerySchema = z.object({
  page: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(1).default(1),
  ),
  pageSize: z.preprocess(
    blankToUndefined,
    z.coerce
      .number()
      .int()
      .min(25)
      .max(SCOREBOARD_MAX_PAGE_SIZE)
      .default(SCOREBOARD_DEFAULT_PAGE_SIZE),
  ),
});

// The board can be admin-specific (live during freeze), so no shared caching.
const NO_STORE = "private, no-store";

function matchesIfNoneMatch(header: string | null, etag: string): boolean {
  if (!header) return false;
  return header
    .split(",")
    .map((part) => part.trim())
    .some((value) => value === "*" || value === etag || value === `W/${etag}`);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const query = parseQuery(request, standingsQuerySchema);
    const user = await optionalApiUser();
    const scoreboard = await getScoreboard(slug, user?.role === "ADMIN", {
      page: query.page,
      pageSize: query.pageSize,
    });

    // The service caches one hash per snapshot/page, so a 304 does not rehash
    // the whole page on every poll.
    const etag = scoreboardEtag(scoreboard);
    if (matchesIfNoneMatch(request.headers.get("if-none-match"), etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag, "Cache-Control": NO_STORE },
      });
    }

    const response = apiOk(scoreboard);
    response.headers.set("ETag", etag);
    response.headers.set("Cache-Control", NO_STORE);
    return response;
  } catch (error) {
    return apiError(error);
  }
}
