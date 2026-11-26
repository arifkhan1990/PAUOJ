import type { Verdict } from "@/lib/verdicts";
import type { JudgeLanguage } from "./types";
import {
  compareJudgeOutput,
  type RunCheckerType,
} from "./compare-output";

export type RunExpectationChecker = {
  type: RunCheckerType;
  floatTolerance: number;
} | null;

export type RunExpectationInput = {
  /** Outcome of the user's program; ACCEPTED means a clean exit. */
  user: { status: Verdict; stdout: string };
  /**
   * Outcome of the reference solution. `undefined` means no reference was
   * requested, while `null` means it was requested but never produced output.
   */
  reference: { status: Verdict; stdout: string } | null | undefined;
  checker: RunExpectationChecker;
  /** Language the user ran, used for honest SQL dialect notes. */
  userLanguage?: JudgeLanguage;
  /** Language of the reference solution, used for honest SQL dialect notes. */
  referenceLanguage?: JudgeLanguage;
};

export type RunExpectation = {
  expectedOutput: string | null;
  matchesExpected: boolean | null;
  expectedNote: string | null;
};

export const REFERENCE_FAILED_NOTE =
  "The reference solution could not produce an expected output for this input.";

export const CUSTOM_CHECKER_NOTE =
  "This problem uses a custom checker; compare the outputs manually.";

export const SQL_DIALECT_NOTE =
  "Expected output was produced by the SQLite reference; MySQL/PostgreSQL output may differ.";

/**
 * Pure decision table for practice custom runs: derive the expected output
 * from a reference run and compare the user's stdout when that is meaningful.
 */
export function computeRunExpectation(
  input: RunExpectationInput,
): RunExpectation {
  const noExpectation: RunExpectation = {
    expectedOutput: null,
    matchesExpected: null,
    expectedNote: null,
  };

  const { reference } = input;
  if (reference === undefined) return noExpectation;
  if (reference === null || reference.status !== "ACCEPTED") {
    return {
      expectedOutput: null,
      matchesExpected: null,
      expectedNote: REFERENCE_FAILED_NOTE,
    };
  }

  const expectedOutput = reference.stdout;
  const dialectDiffers =
    input.referenceLanguage === "sql" &&
    (input.userLanguage === "mysql" || input.userLanguage === "postgresql");
  if (dialectDiffers) {
    return {
      expectedOutput,
      matchesExpected: null,
      expectedNote: SQL_DIALECT_NOTE,
    };
  }
  if (input.checker?.type === "CUSTOM") {
    return {
      expectedOutput,
      matchesExpected: null,
      expectedNote: CUSTOM_CHECKER_NOTE,
    };
  }
  if (input.user.status !== "ACCEPTED" || !input.checker) {
    return { expectedOutput, matchesExpected: null, expectedNote: null };
  }
  return {
    expectedOutput,
    matchesExpected: compareJudgeOutput(
      input.user.stdout,
      expectedOutput,
      input.checker.type,
      input.checker.floatTolerance,
    ),
    expectedNote: null,
  };
}
