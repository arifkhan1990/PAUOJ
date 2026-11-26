import { describe, expect, it } from "vitest";
import {
  computeRunExpectation,
  CUSTOM_CHECKER_NOTE,
  REFERENCE_FAILED_NOTE,
  SQL_DIALECT_NOTE,
} from "./run-expectation";

const exact = { type: "EXACT" as const, floatTolerance: 0.000001 };

describe("computeRunExpectation", () => {
  it("returns no expectation when no reference was requested", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "300" },
        reference: undefined,
        checker: exact,
      }),
    ).toEqual({
      expectedOutput: null,
      matchesExpected: null,
      expectedNote: null,
    });
  });

  it("explains a reference that failed to run", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "300" },
        reference: null,
        checker: exact,
      }),
    ).toEqual({
      expectedOutput: null,
      matchesExpected: null,
      expectedNote: REFERENCE_FAILED_NOTE,
    });
  });

  it("explains a reference that exited with an error", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "300" },
        reference: { status: "RUNTIME_ERROR", stdout: "" },
        checker: exact,
      }),
    ).toEqual({
      expectedOutput: null,
      matchesExpected: null,
      expectedNote: REFERENCE_FAILED_NOTE,
    });
  });

  it("compares clean user output with the reference output", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "300\n" },
        reference: { status: "ACCEPTED", stdout: "300" },
        checker: exact,
      }),
    ).toEqual({
      expectedOutput: "300",
      matchesExpected: true,
      expectedNote: null,
    });
  });

  it("reports a mismatch without hiding the expected output", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "301" },
        reference: { status: "ACCEPTED", stdout: "300" },
        checker: exact,
      }),
    ).toEqual({
      expectedOutput: "300",
      matchesExpected: false,
      expectedNote: null,
    });
  });

  it("honours TOKEN and FLOAT checkers", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "1  2\n3" },
        reference: { status: "ACCEPTED", stdout: "1 2 3" },
        checker: { type: "TOKEN", floatTolerance: 0.000001 },
      }).matchesExpected,
    ).toBe(true);
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "1.0000001" },
        reference: { status: "ACCEPTED", stdout: "1" },
        checker: { type: "FLOAT", floatTolerance: 0.000001 },
      }).matchesExpected,
    ).toBe(true);
  });

  it("asks for a manual comparison with a custom checker", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "300" },
        reference: { status: "ACCEPTED", stdout: "300" },
        checker: { type: "CUSTOM", floatTolerance: 0.000001 },
      }),
    ).toEqual({
      expectedOutput: "300",
      matchesExpected: null,
      expectedNote: CUSTOM_CHECKER_NOTE,
    });
  });

  it("shows expected output but does not compare a failed user run", () => {
    expect(
      computeRunExpectation({
        user: { status: "RUNTIME_ERROR", stdout: "" },
        reference: { status: "ACCEPTED", stdout: "300" },
        checker: exact,
      }),
    ).toEqual({
      expectedOutput: "300",
      matchesExpected: null,
      expectedNote: null,
    });
  });

  it("shows expected output when no checker metadata is available", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "300" },
        reference: { status: "ACCEPTED", stdout: "300" },
        checker: null,
      }),
    ).toEqual({
      expectedOutput: "300",
      matchesExpected: null,
      expectedNote: null,
    });
  });

  it.each(["mysql", "postgresql"] as const)(
    "shows the SQLite expected output but does not compare %s output",
    (language) => {
      expect(
        computeRunExpectation({
          user: { status: "ACCEPTED", stdout: "300" },
          reference: { status: "ACCEPTED", stdout: "300" },
          checker: exact,
          userLanguage: language,
          referenceLanguage: "sql",
        }),
      ).toEqual({
        expectedOutput: "300",
        matchesExpected: null,
        expectedNote: SQL_DIALECT_NOTE,
      });
    },
  );

  it("compares SQLite-backed SQL and sqlite runs normally", () => {
    for (const language of ["sql", "sqlite"] as const) {
      expect(
        computeRunExpectation({
          user: { status: "ACCEPTED", stdout: "300" },
          reference: { status: "ACCEPTED", stdout: "300" },
          checker: exact,
          userLanguage: language,
          referenceLanguage: "sql",
        }),
      ).toEqual({
        expectedOutput: "300",
        matchesExpected: true,
        expectedNote: null,
      });
    }
  });

  it("keeps the dialect note honest even for a mismatching output", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "301" },
        reference: { status: "ACCEPTED", stdout: "300" },
        checker: exact,
        userLanguage: "postgresql",
        referenceLanguage: "sql",
      }).matchesExpected,
    ).toBeNull();
  });

  it("does not apply the dialect note to non-SQL references", () => {
    expect(
      computeRunExpectation({
        user: { status: "ACCEPTED", stdout: "300" },
        reference: { status: "ACCEPTED", stdout: "300" },
        checker: exact,
        userLanguage: "mysql",
        referenceLanguage: "python",
      }),
    ).toEqual({
      expectedOutput: "300",
      matchesExpected: true,
      expectedNote: null,
    });
  });
});
