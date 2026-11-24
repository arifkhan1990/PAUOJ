/**
 * Minimal dependency-free iCalendar (RFC 5545) builder for contest downloads.
 * Only the properties a calendar client needs are emitted; times are always
 * UTC so the file is timezone-safe on every device.
 */

export type ContestCalendarInput = {
  title: string;
  description?: string | null;
  startAt: Date | string;
  endAt: Date | string;
  url: string;
  /** Stable per-contest seed, usually the contest slug. */
  uidSeed: string;
  location?: string;
  /** Injectable clock so tests stay deterministic. */
  stamp?: Date | string;
};

const CRLF = "\r\n";
const MAX_LINE_BYTES = 75;
const MAX_DESCRIPTION_CHARS = 1_000;

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** Escape a TEXT value per RFC 5545 section 3.3.11. */
export function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** UTC timestamp in the compact iCalendar form, e.g. 20261130T160000Z. */
export function icsDateTime(value: Date | string): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid contest date");
  }
  return `${date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`;
}

/**
 * Fold long content lines at 75 UTF-8 octets. Continuation lines start with a
 * single space, which counts toward the limit. Iterating code points keeps
 * multi-byte characters intact.
 */
export function icsFoldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= MAX_LINE_BYTES) return line;

  const chunks: string[] = [];
  let current = "";
  let currentBytes = 0;

  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = chunks.length === 0 ? MAX_LINE_BYTES : MAX_LINE_BYTES - 1;
    if (currentBytes + bytes > limit) {
      chunks.push(current);
      current = char;
      currentBytes = bytes;
    } else {
      current += char;
      currentBytes += bytes;
    }
  }
  chunks.push(current);
  return chunks.join(`${CRLF} `);
}

function line(value: string): string {
  return icsFoldLine(value);
}

export function contestCalendarFilename(slug: string): string {
  const safe = slug.trim().replace(/[^a-zA-Z0-9-_]+/g, "-");
  return `pauoj-${safe || "contest"}.ics`;
}

export function buildContestCalendar(input: ContestCalendarInput): string {
  const start = toDate(input.startAt);
  if (Number.isNaN(start.getTime())) throw new Error("Invalid start date");
  if (toDate(input.endAt).getTime() <= start.getTime()) {
    throw new Error("Contest end must be after the start");
  }

  const description = (input.description ?? "")
    .trim()
    .slice(0, MAX_DESCRIPTION_CHARS);
  const stamp = input.stamp ? toDate(input.stamp) : new Date();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PAU OJ//Contest Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    line(`UID:${icsEscape(input.uidSeed)}@pauoj`),
    line(`DTSTAMP:${icsDateTime(stamp)}`),
    line(`DTSTART:${icsDateTime(start)}`),
    line(`DTEND:${icsDateTime(input.endAt)}`),
    line(`SUMMARY:${icsEscape(input.title)}`),
    ...(description
      ? [line(`DESCRIPTION:${icsEscape(description)}`)]
      : []),
    line(`URL:${input.url}`),
    line(`LOCATION:${icsEscape(input.location ?? "PAU OJ")}`),
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.join(CRLF)}${CRLF}`;
}
