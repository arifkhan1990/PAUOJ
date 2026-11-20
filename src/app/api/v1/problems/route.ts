import type { NextRequest } from "next/server";
import { z } from "zod";
import { optionalApiUser } from "@/server/api/auth";
import { apiError, apiOk } from "@/server/api/responses";
import {
  pageMeta,
  paginationSchema,
  parseQuery,
} from "@/server/api/validation";
import { listProblems } from "@/server/services/problems";

const querySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
  tag: z.string().trim().max(60).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const query = parseQuery(request, querySchema);
    const user = await optionalApiUser();
    const { items, total } = await listProblems({
      page: query,
      q: query.q,
      difficulty: query.difficulty,
      tag: query.tag,
      userId: user?.id ?? null,
      isAdmin: user?.role === "ADMIN",
    });
    return apiOk(items, pageMeta(total, query));
  } catch (error) {
    return apiError(error);
  }
}
