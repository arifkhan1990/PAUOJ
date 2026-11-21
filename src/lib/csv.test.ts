import { describe, expect, it } from "vitest";
import { escapeFormula, fromCsv, toCsv } from "./csv";

describe("escapeFormula", () => {
  it.each([
    ["=cmd()", "'=cmd()"],
    ["+1", "'+1"],
    ["-1", "'-1"],
    ["@x", "'@x"],
    ["\t=1+1", "'\t=1+1"],
    ["\rfoo", "'\rfoo"],
  ])("prefixes formula-leading string %j with an apostrophe", (input, expected) => {
    expect(escapeFormula(input)).toBe(expected);
  });

  it("leaves normal text untouched", () => {
    expect(escapeFormula("hello")).toBe("hello");
    expect(escapeFormula("a=b")).toBe("a=b");
    expect(escapeFormula("'=already text")).toBe("'=already text");
    expect(escapeFormula("")).toBe("");
  });
});

describe("fromCsv", () => {
  it("strips a UTF-8 BOM and splits CRLF records", () => {
    expect(fromCsv("\uFEFFref,email\r\n2210145,a@b.com\r\n")).toEqual([
      ["ref", "email"],
      ["2210145", "a@b.com"],
    ]);
  });

  it("keeps quoted commas, doubled quotes and embedded newlines in one field", () => {
    const csv = 'ref,name\r\n1,"Hasan, Md.""Rakib"""\r\n2,"line one\r\nline two"\r\n';
    expect(fromCsv(csv)).toEqual([
      ["ref", "name"],
      ["1", 'Hasan, Md."Rakib"'],
      ["2", "line one\r\nline two"],
    ]);
  });

  it("accepts LF-only and mixed line endings", () => {
    expect(fromCsv("a,b\nc,d\r\ne,f")).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e", "f"],
    ]);
  });

  it("does not emit an empty record for a trailing newline", () => {
    expect(fromCsv("a,b\n")).toEqual([["a", "b"]]);
    expect(fromCsv("a,b")).toEqual([["a", "b"]]);
  });

  it("reports blank lines as a single empty field", () => {
    expect(fromCsv("a,b\n\nc,d\n")).toEqual([["a", "b"], [""], ["c", "d"]]);
  });

  it("preserves empty and trailing empty fields", () => {
    expect(fromCsv("a,,c,")).toEqual([["a", "", "c", ""]]);
    expect(fromCsv('a,""')).toEqual([["a", ""]]);
  });

  it("returns no rows for empty input and treats a quoted empty field as a row", () => {
    expect(fromCsv("")).toEqual([]);
    expect(fromCsv("\uFEFF")).toEqual([]);
    expect(fromCsv('""')).toEqual([[""]]);
  });

  it("round-trips output produced by toCsv", () => {
    const rows = [["a,b", 'say "hi"'], ["2210145", ""]];
    expect(fromCsv(toCsv(rows))).toEqual(rows);
  });
});

describe("toCsv", () => {
  it("escapes and quotes formula cells", () => {
    const csv = toCsv([["=cmd()", "+1", "-1", "@x", "\t=1+1", "\rfoo"]]);
    expect(csv).toBe('\uFEFF"\'=cmd()","\'+1","\'-1","\'@x","\'\t=1+1","\'\rfoo"\r\n');
  });

  it("keeps numbers numeric and unescaped", () => {
    expect(toCsv([[1, -1, 1.5]])).toBe("\uFEFF1,-1,1.5\r\n");
  });

  it("keeps plain text unquoted and untouched", () => {
    expect(toCsv([["hello", "world"]])).toBe("\uFEFFhello,world\r\n");
  });

  it("preserves existing quoting for commas and double quotes", () => {
    expect(toCsv([['a,b', 'say "hi"']])).toBe('\uFEFF"a,b","say ""hi"""\r\n');
  });

  it("preserves BOM and CRLF behaviour across rows", () => {
    expect(toCsv([["a"], ["b"]])).toBe("\uFEFFa\r\nb\r\n");
    expect(toCsv([["=x"], ["plain"]])).toBe('\uFEFF"\'=x"\r\nplain\r\n');
  });

  it("renders null and undefined as empty cells", () => {
    expect(toCsv([[null, undefined, ""]])).toBe("\uFEFF,,\r\n");
  });
});
