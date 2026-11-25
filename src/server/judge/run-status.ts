import type { RunResult, RunStatus } from "@/lib/types";
import type { Verdict } from "@/lib/verdicts";

/**
 * Custom-test runs have no expected output, so the harness reports "ACCEPTED"
 * whenever the program exits cleanly. Relabel it as "EXECUTED" so the result is
 * never shown as correct code; genuine failures keep their verdict.
 */
export function runStatusForOutcome(status: Verdict): RunStatus {
  return status === "ACCEPTED" ? "EXECUTED" : status;
}

type StoredRunResult = Omit<RunResult, "status"> & { status: string };

/**
 * Run results live in Redis for 15 minutes. Results written before the
 * EXECUTED rollout can still say ACCEPTED, so normalize them on read instead
 * of showing a false AC until the cache expires.
 */
export function normalizeStoredRunResult(stored: StoredRunResult): RunResult {
  return {
    ...stored,
    status: stored.status === "ACCEPTED" ? "EXECUTED" : (stored.status as RunStatus),
    expectedOutput: stored.expectedOutput ?? null,
    matchesExpected: stored.matchesExpected ?? null,
    expectedNote: stored.expectedNote ?? null,
  };
}
