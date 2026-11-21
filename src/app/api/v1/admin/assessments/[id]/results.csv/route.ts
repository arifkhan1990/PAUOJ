import { NextResponse } from "next/server";
import { requireApiStaff } from "@/server/api/auth";
import { apiError } from "@/server/api/responses";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { exportAssessmentResults } from "@/server/services/assessment-results-export";

function csvFilename(slug: string): string {
  const safe = slug.replace(/[^A-Za-z0-9._-]+/g, "-") || "assessment";
  return `${safe}-results.csv`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await requireApiStaff();
    const { id } = await context.params;
    const result = await exportAssessmentResults(
      id,
      staff.role === "TEACHER" ? staff.id : undefined,
    );

    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "assessment.export",
      entityType: "assessment",
      entityId: id,
      metadata: {
        rowCount: result.rows.length,
        joinMode: result.assessment.joinMode,
      },
    });

    return new NextResponse(result.csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${csvFilename(result.assessment.slug)}"`,
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
