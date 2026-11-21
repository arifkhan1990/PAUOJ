const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * OWASP CSV-injection guard: a string cell that a spreadsheet could parse as
 * a formula gets a single-quote prefix. Applies to string cells only — numbers
 * stay numeric so they keep their cell type in Excel/LibreOffice.
 */
export function escapeFormula(value: string): string {
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
}

/**
 * RFC-4180 reader: accepts a UTF-8 BOM, quoted fields containing commas,
 * doubled quotes and embedded newlines, and both CRLF and LF record endings.
 * Returns one array per record; a trailing newline does not produce an empty
 * record. `toCsv` is the matching writer.
 */
export function fromCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let pending = false;
  let index = 0;

  while (index < text.length) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      pending = true;
      index += 1;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      pending = true;
      index += 1;
      continue;
    }
    if (char === "\r" || char === "\n") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      pending = false;
      index += 1;
      continue;
    }
    field += char;
    pending = true;
    index += 1;
  }

  if (pending) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const lines = rows.map((row) =>
    row
      .map((cell) => {
        const isString = typeof cell === "string";
        const value = cell === null || cell === undefined ? "" : String(cell);
        const safe = isString ? escapeFormula(value) : value;
        return /[",\r\n]/.test(safe) || safe !== value
          ? `"${safe.replaceAll('"', '""')}"`
          : safe;
      })
      .join(","),
  );
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
