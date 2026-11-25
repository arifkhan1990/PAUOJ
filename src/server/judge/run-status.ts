import type { RunStatus } from "@/lib/types";
import type { Verdict } from "@/lib/verdicts";

/**
 * Custom-test runs have no expected output, so the harness reports "ACCEPTED"
 * whenever the program exits cleanly. Relabel it as "EXECUTED" so the result is
 * never shown as correct code; genuine failures keep their verdict.
 */
export function runStatusForOutcome(status: Verdict): RunStatus {
  return status === "ACCEPTED" ? "EXECUTED" : status;
}
