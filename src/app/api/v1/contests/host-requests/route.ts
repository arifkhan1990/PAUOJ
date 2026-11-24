import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { apiCreated, apiError, apiOk } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestHostRequestSchema } from "@/lib/schemas/contest-ops";
import {
  createContestHostRequest,
  listMyContestHostRequests,
} from "@/server/services/contest-host-requests";

export async function GET() {
  try {
    const user = await requireApiUser();
    return apiOk(await listMyContestHostRequests(user.id));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    await enforceRateLimit(`contest:host:request:${user.id}`, 5, 60 * 60);
    const input = await parseJson(request, contestHostRequestSchema);
    return apiCreated(await createContestHostRequest(user, input));
  } catch (error) {
    return apiError(error);
  }
}
