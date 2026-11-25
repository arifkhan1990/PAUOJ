export type RunCheckerType = "EXACT" | "TOKEN" | "FLOAT" | "CUSTOM";

/**
 * Mirrors `normalize` in judge/harness.py: CRLF/CR become LF, trailing spaces
 * and tabs are dropped per line, and trailing blank lines are removed.
 */
export function normalizeJudgeOutput(value: string): string {
  const text = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").map((line) => line.replace(/[ \t]+$/, ""));
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

function tokens(value: string): string[] {
  const trimmed = value.trim();
  return trimmed.length === 0 ? [] : trimmed.split(/\s+/);
}

/**
 * Compares user output with a reference output using the problem's checker.
 * CUSTOM checkers need the checker program, so they return null (unknown).
 */
export function compareJudgeOutput(
  actual: string,
  expected: string,
  checker: RunCheckerType,
  floatTolerance: number,
): boolean | null {
  if (checker === "CUSTOM") return null;
  if (checker === "EXACT") {
    return normalizeJudgeOutput(actual) === normalizeJudgeOutput(expected);
  }
  if (checker === "TOKEN") {
    return tokens(actual).join("\u0000") === tokens(expected).join("\u0000");
  }
  const actualTokens = tokens(actual);
  const expectedTokens = tokens(expected);
  if (actualTokens.length !== expectedTokens.length) return false;
  for (let index = 0; index < expectedTokens.length; index += 1) {
    const left = Number(actualTokens[index]);
    const right = Number(expectedTokens[index]);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
    if (Math.abs(left - right) > floatTolerance) return false;
  }
  return true;
}
