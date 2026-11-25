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
