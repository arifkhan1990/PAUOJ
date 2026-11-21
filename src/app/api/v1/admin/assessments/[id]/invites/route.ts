import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, requireApiStaff } from "@/server/api/auth";
import { ApiError } from "@/server/api/errors";
import { apiError, apiOk } from "@/server/api/responses";
import { getDb } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import {
  MAX_ROSTER_BYTES,
  parseRoster,
} from "@/lib/assessment-roster";
import { listInvites } from "@/server/services/assessment-invites";
import { importAssessmentRoster } from "@/server/services/assessment-invite-import";

// JSON escaping can roughly double the CSV payload, so the early
// Content-Length guard is looser than the CSV byte cap. The authoritative
// check below runs on the decoded `csv` string before any DB write.
const MAX_BODY_BYTES = MAX_ROSTER_BYTES * 2 + 8 * 1024;

const mappingSchema = z.object({
  candidate_ref: z.number().int().min(0).max(999).optional(),
  email: z.number().int().min(0).max(999).optional(),
  candidate_name: z.number().int().min(0).max(999).optional(),
  group_label: z.number().int().min(0).max(999).optional(),
});

const rosterImportSchema = z.object({
  csv: z.string().min(1, "Paste the roster CSV."),
  mapping: mappingSchema.optional(),
  groupLabel: z.string().optional(),
});

function rosterTooLarge(): ApiError {
  return new ApiError(
    "ROSTER_TOO_LARGE",
    `This roster is larger than ${MAX_ROSTER_BYTES / 1024} KB. Split it into smaller imports.`,
    413,
  );
}

function parseBody(text: string): z.infer<typeof rosterImportSchema> {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
  const parsed = rosterImportSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "VALIDATION_ERROR",
      "Some fields are invalid.",
      422,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  return parsed.data;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await requireApiStaff();
    const { id } = await context.params;
    const invites = await listInvites(
      id,
      staff.role === "TEACHER" ? staff.id : undefined,
    );
    return apiOk({ invites });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const staff = await requireApiStaff();
    const { id } = await context.params;

    const declaredLength = request.headers.get("content-length");
    if (
      declaredLength !== null &&
      Number(declaredLength) > MAX_BODY_BYTES
    ) {
      throw rosterTooLarge();
    }

    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) {
      throw rosterTooLarge();
    }
    const body = parseBody(text);
    if (Buffer.byteLength(body.csv, "utf8") > MAX_ROSTER_BYTES) {
      throw rosterTooLarge();
    }

    const parsed = parseRoster({
      csv: body.csv,
      mapping: body.mapping,
      groupLabel: body.groupLabel,
    });
    const report = await importAssessmentRoster(id, parsed, {
      ownerId: staff.role === "TEACHER" ? staff.id : undefined,
      actorId: staff.id,
    });

    await getDb().insert(auditLogs).values({
      actorId: staff.id,
      action: "assessment.invites.import",
      entityType: "assessment",
      entityId: id,
      metadata: {
        counts: report.counts,
        rows: report.rows.length,
        groupLabel: body.groupLabel?.trim() || null,
      },
    });

    return apiOk({
      rows: report.rows,
      counts: report.counts,
      mapping: parsed.mapping,
      header: parsed.header,
    });
  } catch (error) {
    return apiError(error);
  }
}
