import { describe, expect, it } from "vitest";
import {
  contributionExportCsv,
  type ContributionExportRow,
} from "./contribution-export";

const baseRow: ContributionExportRow = {
  id: "c-1",
  problemSlug: "two-sum",
  problemTitle: "Two Sum",
  kind: "EDITORIAL",
  status: "APPROVED",
  contributorUsername: "alice",
  contributorName: "Doe, Jane",
  reviewerUsername: null,
  reviewerName: null,
  note: "=cmd()",
  reviewNote: null,
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
  reviewedAt: null,
};

/** Minimal RFC-4180 line parser: split on commas outside quotes, unescape "". */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

describe("contributionExportCsv", () => {
  it("renders a valid 14-column row with the formula cell escaped and quoted", () => {
    const csv = contributionExportCsv([baseRow]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(3); // header, row, trailing empty after final CRLF
    expect(lines[0].startsWith("\uFEFFid,problem_slug,problem_title")).toBe(true);

    const cells = parseCsvLine(lines[1]);
    expect(cells).toHaveLength(14);
    // note is column index 9
    expect(cells[9]).toBe("'=cmd()");
    // the name containing a comma survives the round trip
    expect(cells[6]).toBe("Doe, Jane");
    // id/slug stay unquoted plain cells
    expect(lines[1].startsWith("c-1,two-sum,Two Sum,")).toBe(true);
  });

  it("leaves rows without formula content unchanged in shape", () => {
    const row: ContributionExportRow = {
      ...baseRow,
      note: "fixed a typo",
      contributorName: "Plain Name",
      reviewedAt: new Date("2026-01-02T04:04:05.000Z"),
    };
    const csv = contributionExportCsv([row]);
    const lines = csv.split("\r\n");
    const cells = parseCsvLine(lines[1]);
    expect(cells).toHaveLength(14);
    expect(cells[9]).toBe("fixed a typo");
    expect(cells[6]).toBe("Plain Name");
    // review_hours is numeric text and stays unquoted/unprefixed
    expect(cells[13]).toBe("1.0");
  });

  it("escapes every attacker-influenced column", () => {
    const row: ContributionExportRow = {
      ...baseRow,
      problemTitle: "+SUM(A1)",
      contributorName: "@alice",
      reviewNote: "-1+1",
    };
    const cells = parseCsvLine(contributionExportCsv([row]).split("\r\n")[1]);
    expect(cells[2]).toBe("'+SUM(A1)");
    expect(cells[6]).toBe("'@alice");
    expect(cells[10]).toBe("'-1+1");
  });
});
