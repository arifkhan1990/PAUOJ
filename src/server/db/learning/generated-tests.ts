/**
 * Helpers for large test cases. Keeping generated inputs as expressions
 * avoids 100 KB+ literals in the seed files while still exercising the
 * declared maximum bounds.
 */
export function numbersInput(values: number[]): string {
  return `${values.length}\n${values.join(" ")}\n`;
}

export function nAndNumbers(n: number, values: number[]): string {
  return `${n}\n${values.join(" ")}\n`;
}

export function matrixInput(rows: number[][]): string {
  return `${rows.length} ${rows[0]?.length ?? 0}\n${rows
    .map((row) => row.join(" "))
    .join("\n")}\n`;
}

export function lineInput(lines: string[]): string {
  return `${lines.length}\n${lines.join("\n")}\n`;
}

export function spaceOutput(values: Array<string | number>): string {
  return `${values.join(" ")}\n`;
}

export function newlineOutput(values: Array<string | number>): string {
  return values.length > 0 ? `${values.join("\n")}\n` : "";
}
