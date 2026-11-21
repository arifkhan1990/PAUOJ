import { errors } from "@/server/api/errors";
import { normaliseOptionalText, normaliseRef } from "./assessment-invites";
import { fromCsv } from "./csv";

/**
 * Limits are enforced by `parseRoster`; the invite import route checks the
 * byte cap on the request body before any parsing or DB write.
 */
export const MAX_ROSTER_BYTES = 64 * 1024;
export const MAX_ROSTER_ROWS = 500;

export const ROSTER_FIELDS = [
  "candidate_ref",
  "email",
  "candidate_name",
  "group_label",
] as const;

export type RosterField = (typeof ROSTER_FIELDS)[number];

/** Field -> 0-based column index. Manual values override header detection. */
export type RosterMapping = Partial<Record<RosterField, number>>;

export type RosterDelivery = "email" | "link";
export type RosterParseStatus = "valid" | "duplicate" | "invalid";
export type RosterImportStatus =
  | "created"
  | "updated"
  | "unchanged"
  | "duplicate"
  | "invalid";

export type RosterRowInput = {
  /** 1-based CSV record number; the header row is 1. */
  rowNumber: number;
  candidateRef: string;
  email: string | null;
  candidateName: string | null;
  groupLabel: string | null;
};

export type RosterParseRow = RosterRowInput & {
  status: RosterParseStatus;
  delivery: RosterDelivery;
  reason?: string;
  fix?: string;
};

export type RosterRowReport = RosterRowInput & {
  status: RosterImportStatus;
  delivery: RosterDelivery;
  reason?: string;
  fix?: string;
};

export type RosterParseResult = {
  /** Trimmed header cells, or null when the paste had no header row. */
  header: string[] | null;
  /** Resolved field -> column index, including manual overrides. */
  mapping: RosterMapping;
  rows: RosterParseRow[];
  counts: { valid: number; duplicate: number; invalid: number };
};

export type RosterImportCounts = {
  created: number;
  updated: number;
  unchanged: number;
  duplicate: number;
  invalid: number;
};

export type RosterParseInput = {
  csv: string;
  mapping?: RosterMapping | null;
  /** Fallback for rows whose group label is blank. */
  groupLabel?: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_ALIASES: Record<RosterField, readonly string[]> = {
  candidate_ref: [
    "candidate_ref",
    "candidate ref",
    "student_id",
    "student id",
    "roll",
    "roll_no",
    "roll no",
    "rollno",
    "id",
    "applicant_id",
    "applicant id",
    "employee_id",
    "employee id",
  ],
  email: ["email", "e-mail", "e_mail", "mail"],
  candidate_name: [
    "candidate_name",
    "candidate name",
    "name",
    "student_name",
    "student name",
    "full_name",
    "full name",
  ],
  group_label: [
    "group_label",
    "group label",
    "group",
    "section",
    "batch",
    "cohort",
    "employer",
  ],
};

const ALIAS_LOOKUP = new Map<string, RosterField>();
for (const field of ROSTER_FIELDS) {
  for (const alias of FIELD_ALIASES[field]) {
    ALIAS_LOOKUP.set(normaliseHeaderCell(alias), field);
  }
}

function normaliseHeaderCell(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function detectHeader(cells: string[]): RosterMapping {
  const mapping: RosterMapping = {};
  cells.forEach((cell, index) => {
    if (cell.trim().length === 0) return;
    const field = ALIAS_LOOKUP.get(normaliseHeaderCell(cell));
    if (field && mapping[field] === undefined) mapping[field] = index;
  });
  return mapping;
}

function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length;
}

function cellAt(cells: string[], index: number | undefined): string {
  if (index === undefined || index < 0 || index >= cells.length) return "";
  return cells[index];
}

function emptyRosterError(): never {
  throw errors.validation(
    "The pasted roster is empty. Paste a header row and at least one candidate row.",
  );
}

function missingRefColumnError(): never {
  throw errors.validation(
    "Could not resolve a candidate_ref column. Add a candidate_ref column or send an explicit column mapping.",
  );
}

export function parseRoster(input: RosterParseInput): RosterParseResult {
  if (input.csv.trim().length === 0) emptyRosterError();
  if (utf8Length(input.csv) > MAX_ROSTER_BYTES) {
    throw errors.validation(
      `This roster is larger than ${MAX_ROSTER_BYTES / 1024} KB. Split it into smaller imports.`,
    );
  }

  const records = fromCsv(input.csv)
    .map((cells, index) => ({ cells, rowNumber: index + 1 }))
    .filter((record) => record.cells.some((cell) => cell.trim().length > 0));
  if (records.length === 0) emptyRosterError();

  const detected = detectHeader(records[0].cells);
  const hasHeader = Object.keys(detected).length > 0;
  const manual: RosterMapping = {};
  for (const field of ROSTER_FIELDS) {
    const index = input.mapping?.[field];
    if (index !== undefined) manual[field] = index;
  }
  const mapping: RosterMapping = { ...detected, ...manual };
  if (mapping.candidate_ref === undefined) missingRefColumnError();

  const width = records.reduce(
    (max, record) => Math.max(max, record.cells.length),
    0,
  );
  for (const field of ROSTER_FIELDS) {
    const index = mapping[field];
    if (index !== undefined && (index < 0 || index >= width)) {
      throw errors.validation(
        "The column mapping points to a column that is not in the pasted roster.",
      );
    }
  }

  const dataRecords = hasHeader ? records.slice(1) : records;
  if (dataRecords.length === 0) {
    throw errors.validation(
      "The roster has a header but no candidate rows. Paste at least one candidate row below the header.",
    );
  }
  if (dataRecords.length > MAX_ROSTER_ROWS) {
    throw errors.validation(
      `This roster has ${dataRecords.length} rows. The import limit is ${MAX_ROSTER_ROWS} rows — split the roster and import it in batches.`,
    );
  }

  const fallbackGroupLabel = normaliseOptionalText(input.groupLabel);
  const seenRefs = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  const rows: RosterParseRow[] = [];
  const counts = { valid: 0, duplicate: 0, invalid: 0 };

  for (const record of dataRecords) {
    const candidateRef = normaliseRef(
      cellAt(record.cells, mapping.candidate_ref),
    );
    const rawEmail = cellAt(record.cells, mapping.email).trim();
    const email = rawEmail.length > 0 ? rawEmail.toLowerCase() : null;
    const candidateName = normaliseOptionalText(
      cellAt(record.cells, mapping.candidate_name),
    );
    const groupLabel =
      normaliseOptionalText(cellAt(record.cells, mapping.group_label)) ??
      fallbackGroupLabel;

    const base: RosterRowInput = {
      rowNumber: record.rowNumber,
      candidateRef,
      email,
      candidateName,
      groupLabel,
    };

    if (!candidateRef) {
      pushInvalid(
        rows,
        counts,
        base,
        "candidate_ref is required.",
        "Add the student ID, roll number or applicant ID in the candidate_ref column.",
      );
      continue;
    }
    if (email && !EMAIL_PATTERN.test(email)) {
      pushInvalid(
        rows,
        counts,
        base,
        `Email "${email}" is not a valid address.`,
        "Fix the email or leave it blank to deliver this candidate by link.",
      );
      continue;
    }

    const refKey = candidateRef.toLowerCase();
    const emailKey = email;
    const duplicateRefRow = seenRefs.get(refKey);
    const duplicateEmailRow = emailKey ? seenEmails.get(emailKey) : undefined;

    if (duplicateRefRow !== undefined) {
      counts.duplicate += 1;
      rows.push({
        ...base,
        status: "duplicate",
        delivery: email ? "email" : "link",
        reason: `Duplicate candidate_ref "${candidateRef}" — it already appears on row ${duplicateRefRow}.`,
        fix: "Keep one row per candidate reference and remove the duplicate.",
      });
      continue;
    }
    if (duplicateEmailRow !== undefined) {
      counts.duplicate += 1;
      rows.push({
        ...base,
        status: "duplicate",
        delivery: email ? "email" : "link",
        reason: `Duplicate email "${email}" — it already appears on row ${duplicateEmailRow}.`,
        fix: "Leave the email blank and deliver by link.",
      });
      continue;
    }

    seenRefs.set(refKey, record.rowNumber);
    if (emailKey) seenEmails.set(emailKey, record.rowNumber);
    counts.valid += 1;
    rows.push({
      ...base,
      status: "valid",
      delivery: email ? "email" : "link",
    });
  }

  return {
    header: hasHeader ? records[0].cells.map((cell) => cell.trim()) : null,
    mapping,
    rows,
    counts,
  };
}

function pushInvalid(
  rows: RosterParseRow[],
  counts: { invalid: number },
  base: RosterRowInput,
  reason: string,
  fix: string,
): void {
  counts.invalid += 1;
  rows.push({
    ...base,
    email: null,
    status: "invalid",
    delivery: "link",
    reason,
    fix,
  });
}
