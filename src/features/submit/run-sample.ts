export type RunSample = { input: string; output: string };

/**
 * Mirrors `normalize` in judge/harness.py so a custom run is compared the same
 * way the judge compares output: CRLF/CR become LF, trailing spaces and tabs
 * are dropped per line, and trailing blank lines are removed.
 */
export function normalizeRunText(value: string): string {
  const text = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").map((line) => line.replace(/[ \t]+$/, ""));
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

export function findMatchingSample(
  samples: RunSample[],
  stdin: string,
): { sample: RunSample; index: number } | null {
  const target = normalizeRunText(stdin);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    if (normalizeRunText(sample.input) === target) return { sample, index };
  }
  return null;
}

export function outputsMatch(stdout: string, expected: string): boolean {
  return normalizeRunText(stdout) === normalizeRunText(expected);
}

export type RunComparisonKind = "sample" | "reference" | "none";

export type RunComparison = {
  kind: RunComparisonKind;
  expected: string | null;
  matches: boolean | null;
};

export type RunComparisonInput = {
  samples: RunSample[];
  stdin: string;
  stdout: string;
  expectedOutput?: string | null;
  matchesExpected?: boolean | null;
};

/**
 * Picks the expected output a custom run is compared against. An official
 * sample keeps priority: when the input equals a sample input, the sample
 * output is authoritative. Otherwise the reference solution's output is used
 * when the server provided one. `matches` stays null for a reference output
 * the server did not compare, so the UI never claims pass/fail.
 */
export function resolveRunComparison({
  samples,
  stdin,
  stdout,
  expectedOutput,
  matchesExpected,
}: RunComparisonInput): RunComparison {
  const sample = findMatchingSample(samples, stdin);
  if (sample) {
    return {
      kind: "sample",
      expected: sample.sample.output,
      matches: outputsMatch(stdout, sample.sample.output),
    };
  }
  if (expectedOutput !== undefined && expectedOutput !== null) {
    return {
      kind: "reference",
      expected: expectedOutput,
      matches: matchesExpected ?? null,
    };
  }
  return { kind: "none", expected: null, matches: null };
}

export type RunNoticeInput = {
  status: string;
  finished: boolean;
  stdout: string;
  stderr: string;
};

/**
 * The “no output” note belongs only to a clean custom run. A failed run
 * (compile error, runtime error, etc.) already has a verdict and must not claim
 * it finished with no output.
 */
export function shouldShowNoOutputNotice(run: RunNoticeInput): boolean {
  const executed = run.status === "EXECUTED" || run.status === "ACCEPTED";
  return (
    run.finished &&
    executed &&
    run.stdout.length === 0 &&
    run.stderr.length === 0
  );
}
