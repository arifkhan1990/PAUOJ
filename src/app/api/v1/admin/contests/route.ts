import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiStaff } from "@/server/api/auth";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { contestInputSchema } from "@/lib/schemas/contest";
import { createContest } from "@/server/services/admin-contests";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const staff = await requireApiStaff();
    const input = await parseJson(request, contestInputSchema);
    const created = await createContest(staff, input);
    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "contest.create",
      entityType: "contest",
      entityId: created.id,
      metadata: { slug: created.slug },
    });
    return apiCreated(created);
  } catch (error) {
    return apiError(error);
  }
}
