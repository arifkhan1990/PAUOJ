import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiStaff } from "@/server/api/auth";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { problemInputSchema } from "@/lib/schemas/problem";
import { createProblem } from "@/server/services/admin-problems";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const staff = await requireApiStaff();
    const input = await parseJson(request, problemInputSchema);
    const created = await createProblem(staff.id, input);
    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "problem.create",
      entityType: "problem",
      entityId: created.id,
      metadata: { slug: created.slug },
    });
    return apiCreated(created);
  } catch (error) {
    return apiError(error);
  }
}
