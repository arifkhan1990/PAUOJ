import type { NextRequest } from "next/server";
import { assertSameOrigin, requireApiStaff } from "@/server/api/auth";
import { apiCreated, apiError } from "@/server/api/responses";
import { parseJson } from "@/server/api/validation";
import { assessmentInputSchema } from "@/lib/schemas/assessment";
import { createAssessment } from "@/server/services/admin-assessments";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const staff = await requireApiStaff();
    const input = await parseJson(request, assessmentInputSchema);
    const created = await createAssessment(
      staff.id,
      input,
      staff.role === "TEACHER" ? staff.id : undefined,
    );
    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "assessment.create",
      entityType: "assessment",
      entityId: created.id,
      metadata: { slug: created.slug },
    });
    return apiCreated(created);
  } catch (error) {
    return apiError(error);
  }
}
