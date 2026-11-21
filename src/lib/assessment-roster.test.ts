import { describe, expect, it } from "vitest";
import { ApiError } from "@/server/api/errors";
import {
  MAX_ROSTER_BYTES,
  MAX_ROSTER_ROWS,
  parseRoster,
} from "./assessment-roster";

function errorOf(run: () => unknown): ApiError {
  try {
    run();
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error("expected parseRoster to throw");
}

describe("parseRoster header detection", () => {
  it("maps common header aliases and normalises values", () => {
    const csv =
      "Student ID,Mail,Full Name,Section\r\n 2210145 , Rakib@Example.COM , Md.  Rakib Hasan , CSE-3B \r\n";
    const result = parseRoster({ csv });

    expect(result.header).toEqual([
      "Student ID",
      "Mail",
      "Full Name",
      "Section",
    ]);
    expect(result.mapping).toEqual({
      candidate_ref: 0,
      email: 1,
      candidate_name: 2,
      group_label: 3,
    });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      rowNumber: 2,
      candidateRef: "2210145",
      email: "rakib@example.com",
      candidateName: "Md.  Rakib Hasan",
      groupLabel: "CSE-3B",
      status: "valid",
      delivery: "email",
    });
    expect(result.counts).toEqual({ valid: 1, duplicate: 0, invalid: 0 });
  });

  it("imports a BOM + CRLF roster with quoted names and mixed email presence", () => {
    const csv =
      '\uFEFFStudent ID,Student Name,Email\r\n2210145,"Hasan, Md. Rakib",rakib@example.com\r\n2210146,"Akter, Nusrat",\r\n';
    const result = parseRoster({ csv });

    expect(result.header?.[0]).toBe("Student ID");
    expect(
      result.rows.map((row) => [
        row.candidateRef,
        row.email,
        row.delivery,
        row.status,
      ]),
    ).toEqual([
      ["2210145", "rakib@example.com", "email", "valid"],
      ["2210146", null, "link", "valid"],
    ]);
    expect(result.rows[0].candidateName).toBe("Hasan, Md. Rakib");
  });

  it("supports the documented ref and group aliases", () => {
    const result = parseRoster({
      csv: "applicant_id,cohort\r\nA-91,Beximco drive\r\n",
    });
    expect(result.mapping).toEqual({ candidate_ref: 0, group_label: 1 });
    expect(result.rows[0].candidateRef).toBe("A-91");
  });

  it("lets a manual mapping override detected columns", () => {
    const result = parseRoster({
      csv: "roll,mail,backup_mail\r\n2210145,old@example.com,new@example.com\r\n",
      mapping: { email: 2 },
    });
    expect(result.mapping).toEqual({
      candidate_ref: 0,
      email: 2,
    });
    expect(result.rows[0].email).toBe("new@example.com");
  });

  it("parses a headerless paste when a manual mapping is supplied", () => {
    const result = parseRoster({
      csv: "2210145,a@example.com\r\n2210146,\r\n",
      mapping: { candidate_ref: 0, email: 1 },
    });
    expect(result.header).toBeNull();
    expect(result.rows.map((row) => row.rowNumber)).toEqual([1, 2]);
    expect(result.rows.map((row) => row.delivery)).toEqual(["email", "link"]);
  });

  it("asks for a mapping when no candidate_ref column can be resolved", () => {
    const error = errorOf(() =>
      parseRoster({ csv: "name,email\r\nRakib,rakib@example.com\r\n" }),
    );
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toMatch(/candidate_ref column/);
    expect(error.message).toMatch(/mapping/);
  });

  it("rejects a mapping that points outside the pasted columns", () => {
    const error = errorOf(() =>
      parseRoster({ csv: "2210145\r\n", mapping: { candidate_ref: 4 } }),
    );
    expect(error.message).toMatch(/not in the pasted roster/);
  });
});

describe("parseRoster row validation", () => {
  it("imports a row without an email as link-only", () => {
    const result = parseRoster({
      csv: "candidate_ref,email\r\n2210145,\r\n",
    });
    expect(result.rows[0]).toMatchObject({
      candidateRef: "2210145",
      email: null,
      status: "valid",
      delivery: "link",
    });
  });

  it("reports a missing candidate_ref without dropping other rows", () => {
    const result = parseRoster({
      csv: "candidate_ref,email\r\n,blank@example.com\r\n2210145,\r\n",
    });
    expect(result.rows[0]).toMatchObject({ status: "invalid", email: null });
    expect(result.rows[0].reason).toMatch(/candidate_ref is required/);
    expect(result.rows[1].status).toBe("valid");
    expect(result.counts).toEqual({ valid: 1, duplicate: 0, invalid: 1 });
  });

  it("reports a malformed email as invalid and names the value", () => {
    const result = parseRoster({
      csv: "candidate_ref,email\r\n2210145,not-an-email\r\n",
    });
    expect(result.rows[0]).toMatchObject({ status: "invalid", email: null });
    expect(result.rows[0].reason).toContain("not-an-email");
  });

  it("treats a blank email as absent, not malformed", () => {
    const result = parseRoster({
      csv: "candidate_ref,email\r\n2210145,   \r\n",
    });
    expect(result.rows[0].status).toBe("valid");
    expect(result.rows[0].email).toBeNull();
  });

  it("flags in-file duplicate refs case and space insensitively", () => {
    const result = parseRoster({
      csv: "candidate_ref\r\n2210145\r\n 2210145 \r\nMD  RAKIB\r\nmd rakib\r\n",
    });
    expect(result.rows.map((row) => row.status)).toEqual([
      "valid",
      "duplicate",
      "valid",
      "duplicate",
    ]);
    expect(result.rows[1].reason).toMatch(/row 2/);
    expect(result.rows[3].reason).toMatch(/row 4/);
  });

  it("flags duplicate emails with the link-only fix", () => {
    const result = parseRoster({
      csv: "candidate_ref,email\r\n1,A@B.com\r\n2,a@b.com\r\n",
    });
    expect(result.rows[1].status).toBe("duplicate");
    expect(result.rows[1].fix).toBe(
      "Leave the email blank and deliver by link.",
    );
    expect(result.counts.duplicate).toBe(1);
  });

  it("skips fully empty lines but keeps physical row numbers", () => {
    const result = parseRoster({
      csv: "candidate_ref\r\n\r\n2210145\r\n",
    });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].rowNumber).toBe(3);
  });

  it("applies the request group label only to rows without one", () => {
    const result = parseRoster({
      csv: "candidate_ref,group_label\r\n1,Batch A\r\n2,\r\n3\r\n",
      groupLabel: "Fall 2026",
    });
    expect(result.rows.map((row) => row.groupLabel)).toEqual([
      "Batch A",
      "Fall 2026",
      "Fall 2026",
    ]);
  });

  it("handles quoted names containing commas and newlines", () => {
    const result = parseRoster({
      csv: 'candidate_ref,candidate_name\r\n1,"Hasan, Md. Rakib"\r\n2,"line one\nline two"\r\n',
    });
    expect(result.rows[0].candidateName).toBe("Hasan, Md. Rakib");
    expect(result.rows[1].candidateName).toBe("line one\nline two");
    expect(result.rows[1].rowNumber).toBe(3);
  });
});

describe("parseRoster limits and empty input", () => {
  it("rejects an empty paste", () => {
    expect(errorOf(() => parseRoster({ csv: "" })).message).toMatch(/empty/);
    expect(errorOf(() => parseRoster({ csv: "   \r\n" })).message).toMatch(
      /empty/,
    );
  });

  it("rejects a header with no data rows", () => {
    expect(
      errorOf(() => parseRoster({ csv: "candidate_ref,email\r\n" })).message,
    ).toMatch(/no candidate rows/);
  });

  it("allows exactly 500 data rows and rejects 501", () => {
    const header = "candidate_ref\r\n";
    const atLimit = header + Array.from({ length: MAX_ROSTER_ROWS }, (_, i) => `r${i}\r\n`).join("");
    expect(parseRoster({ csv: atLimit }).rows).toHaveLength(MAX_ROSTER_ROWS);

    const overLimit = header + Array.from({ length: MAX_ROSTER_ROWS + 1 }, (_, i) => `r${i}\r\n`).join("");
    expect(errorOf(() => parseRoster({ csv: overLimit })).message).toMatch(
      /limit is 500 rows/,
    );
  });

  it("rejects a paste over the 64 KB cap", () => {
    const csv = `candidate_ref,candidate_name\r\n1,${"a".repeat(MAX_ROSTER_BYTES)}`;
    expect(errorOf(() => parseRoster({ csv })).message).toMatch(/64 KB/);
  });
});
