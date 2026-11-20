export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const lines = rows.map((row) =>
    row
      .map((cell) => {
        const value = cell === null || cell === undefined ? "" : String(cell);
        return /[",\r\n]/.test(value)
          ? `"${value.replaceAll('"', '""')}"`
          : value;
      })
      .join(","),
  );
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
