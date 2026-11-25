import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiUser } from "@/server/api/auth";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { sendMessageSchema } from "@/lib/schemas/messages";
import { sendMessage } from "@/server/services/messages";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const { id } = await context.params;
    const input = await parseJson(request, sendMessageSchema);
    return apiCreated(await sendMessage(user, id, input.body));
  } catch (error) {
    return apiError(error);
  }
}
