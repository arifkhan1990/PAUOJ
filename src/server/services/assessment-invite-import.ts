import { isApiError } from "@/server/api/errors";
import type {
  RosterImportCounts,
  RosterParseResult,
  RosterParseRow,
  RosterRowReport,
} from "@/lib/assessment-roster";
import { createInvite } from "./assessment-invites";

export const EMAIL_DUPLICATE_FIX =
  "Leave the email blank and deliver by link.";

export type ImportRosterOptions = {
  /** Set for teachers so invite creation stays inside the owned assessment. */
  ownerId?: string;
  actorId: string;
};

export type RosterImportReport = {
  rows: RosterRowReport[];
  counts: RosterImportCounts;
};

export type InviteImportFailure = {
  status: "duplicate" | "invalid";
  reason: string;
  fix?: string;
};

/**
 * Pure mapping from `createInvite`'s created/updated flags to a report status.
 * `created: false, updated: false` means the existing row was already identical
 * (re-import of the same paste), so it stays an `unchanged` no-op.
 */
export function inviteImportStatus(result: {
  created: boolean;
  updated: boolean;
}): "created" | "updated" | "unchanged" {
  if (result.created) return "created";
  if (result.updated) return "updated";
  return "unchanged";
}

/**
 * Classifies a per-row failure. Auth/ownership (401/403/404) and server errors
 * are `fatal` and bubble up, so a foreign assessment can never be reported as
 * a list of invalid rows. Every other 4xx becomes a row report, never an abort.
 */
export function classifyInviteError(
  error: unknown,
): InviteImportFailure | "fatal" {
  if (!isApiError(error)) return "fatal";
  if (error.code === "INVITE_EMAIL_TAKEN") {
    return {
      status: "duplicate",
      reason: error.message,
      fix: EMAIL_DUPLICATE_FIX,
    };
  }
  if (error.status >= 500 || error.status < 400) return "fatal";
  if (error.status === 401 || error.status === 403 || error.status === 404) {
    return "fatal";
  }
  return { status: "invalid", reason: error.message };
}

function reportBase(row: RosterParseRow) {
  return {
    rowNumber: row.rowNumber,
    candidateRef: row.candidateRef,
    email: row.email,
    candidateName: row.candidateName,
    groupLabel: row.groupLabel,
    delivery: row.email ? ("email" as const) : ("link" as const),
  };
}

/**
 * Imports a parsed roster one row at a time so a bad row is reported instead of
 * aborting its neighbours. Validation stays in `createInvite`; this service
 * only maps its outcome into the per-row report.
 */
export async function importAssessmentRoster(
  assessmentId: string,
  parsed: RosterParseResult,
  options: ImportRosterOptions,
): Promise<RosterImportReport> {
  const rows: RosterRowReport[] = [];
  const counts: RosterImportCounts = {
    created: 0,
    updated: 0,
    unchanged: 0,
    duplicate: 0,
    invalid: 0,
  };

  for (const row of parsed.rows) {
    if (row.status !== "valid") {
      rows.push({
        ...reportBase(row),
        status: row.status,
        reason: row.reason,
        fix: row.fix,
      });
      counts[row.status] += 1;
      continue;
    }

    try {
      const result = await createInvite(
        assessmentId,
        {
          candidateRef: row.candidateRef,
          email: row.email,
          candidateName: row.candidateName,
          groupLabel: row.groupLabel,
        },
        { ownerId: options.ownerId, actorId: options.actorId },
      );
      const status = inviteImportStatus(result);
      rows.push({ ...reportBase(row), status });
      counts[status] += 1;
    } catch (error) {
      const failure = classifyInviteError(error);
      if (failure === "fatal") throw error;
      rows.push({
        ...reportBase(row),
        status: failure.status,
        reason: failure.reason,
        fix: failure.fix,
      });
      counts[failure.status] += 1;
    }
  }

  return { rows, counts };
}
