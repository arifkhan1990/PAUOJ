export type MarkdownAction =
  | "heading2"
  | "heading3"
  | "bold"
  | "italic"
  | "inline-code"
  | "code-block"
  | "link"
  | "image"
  | "bullet-list"
  | "ordered-list"
  | "quote"
  | "table"
  | "divider";

export type MarkdownEditResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

type Edit = { start: number; end: number; text: string };

const HEADING_MARKER = /^#{1,6}[ \t]+/;
const DEFAULT_LANGUAGE = "cpp";
const LINK_TEXT = "link text";
const LINK_URL = "https://example.com";
const IMAGE_ALT = "alt text";
const IMAGE_URL = "https://example.com/image.png";
const TABLE_HEADER_CELL = "Column 1";
const TABLE = [
  "| Column 1 | Column 2 | Column 3 |",
  "| --- | --- | --- |",
  "| Cell 1 | Cell 2 | Cell 3 |",
].join("\n");

function clampOffset(value: string, offset: number): number {
  if (Number.isNaN(offset)) return 0;
  return Math.min(Math.max(Math.trunc(offset), 0), value.length);
}

function normalizeRange(value: string, selectionStart: number, selectionEnd: number) {
  const first = clampOffset(value, selectionStart);
  const second = clampOffset(value, selectionEnd);
  return first <= second
    ? { start: first, end: second }
    : { start: second, end: first };
}

function lineBounds(value: string, start: number, end: number) {
  const from = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
  const breakAt = value.indexOf("\n", end);
  const to = breakAt === -1 ? value.length : breakAt;
  return { from, to };
}

type LineTarget = { text: string; start: number };

function lineTargets(value: string, start: number, end: number): LineTarget[] {
  const { from, to } = lineBounds(value, start, end);
  const targets: LineTarget[] = [];
  let position = from;
  for (const text of value.slice(from, to).split("\n")) {
    targets.push({ text, start: position });
    position += text.length + 1;
  }
  return targets;
}

function applyEdits(value: string, edits: Edit[]): string {
  let result = "";
  let cursor = 0;
  for (const edit of edits) {
    result += value.slice(cursor, edit.start) + edit.text;
    cursor = edit.end;
  }
  return result + value.slice(cursor);
}

/** Maps an offset in the original text onto the edited text. */
function mapPoint(point: number, edits: Edit[]): number {
  let delta = 0;
  for (const edit of edits) {
    if (point < edit.start) break;
    if (point === edit.start) {
      // A caret exactly at an insertion point moves behind the inserted text.
      if (edit.start === edit.end) delta += edit.text.length;
      break;
    }
    if (point < edit.end) {
      return edit.start + delta + Math.min(point - edit.start, edit.text.length);
    }
    delta += edit.text.length - (edit.end - edit.start);
  }
  return point + delta;
}

function finish(
  value: string,
  edits: Edit[],
  start: number,
  end: number,
): MarkdownEditResult {
  if (edits.length === 0) {
    return { value, selectionStart: start, selectionEnd: end };
  }
  return {
    value: applyEdits(value, edits),
    selectionStart: mapPoint(start, edits),
    selectionEnd: mapPoint(end, edits),
  };
}

function wrapInline(
  value: string,
  start: number,
  end: number,
  marker: string,
  placeholder: string,
): MarkdownEditResult {
  const selected = value.slice(start, end);
  const text = selected || placeholder;
  const next = value.slice(0, start) + marker + text + marker + value.slice(end);
  const innerStart = start + marker.length;
  return {
    value: next,
    selectionStart: innerStart,
    selectionEnd: innerStart + text.length,
  };
}

function applyHeading(
  value: string,
  start: number,
  end: number,
  marker: string,
): MarkdownEditResult {
  const targets = lineTargets(value, start, end).filter(
    (target) => target.text.trim() !== "",
  );
  const edits: Edit[] = [];

  for (const target of targets) {
    const existing = HEADING_MARKER.exec(target.text);
    if (!existing) {
      edits.push({ start: target.start, end: target.start, text: marker });
    } else if (existing[0] !== marker) {
      edits.push({
        start: target.start,
        end: target.start + existing[0].length,
        text: marker,
      });
    }
  }

  if (targets.length === 0) {
    const { from } = lineBounds(value, start, start);
    edits.push({ start: from, end: from, text: marker });
  }

  return finish(value, edits, start, end);
}

function toggleLinePrefix(
  value: string,
  start: number,
  end: number,
  prefix: string,
): MarkdownEditResult {
  const targets = lineTargets(value, start, end);
  const filled = targets.filter((target) => target.text.trim() !== "");
  const editable = filled.length > 0 ? filled : targets.slice(0, 1);
  const remove = filled.length > 0 && filled.every((target) => target.text.startsWith(prefix));
  const edits: Edit[] = [];

  for (const target of editable) {
    const prefixed = target.text.startsWith(prefix);
    if (remove) {
      if (prefixed) {
        edits.push({ start: target.start, end: target.start + prefix.length, text: "" });
      }
    } else if (!prefixed) {
      edits.push({ start: target.start, end: target.start, text: prefix });
    }
  }

  return finish(value, edits, start, end);
}

function blockAffixes(value: string, start: number, end: number) {
  const lead = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
  const next = value[end];
  const tail = end < value.length && next !== "\n" && next !== "\r" ? "\n" : "";
  return { lead, tail };
}

function sanitizeLanguage(language?: string): string {
  const cleaned = (language ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+#-]/g, "");
  return cleaned || DEFAULT_LANGUAGE;
}

function insertCodeBlock(
  value: string,
  start: number,
  end: number,
  language?: string,
): MarkdownEditResult {
  const fence = `\`\`\`${sanitizeLanguage(language)}`;
  const code = value.slice(start, end);
  const { lead, tail } = blockAffixes(value, start, end);
  const next =
    value.slice(0, start) + lead + `${fence}\n${code}\n\`\`\`` + tail + value.slice(end);
  const bodyStart = start + lead.length + fence.length + 1;
  return {
    value: next,
    selectionStart: bodyStart,
    selectionEnd: bodyStart + code.length,
  };
}

function insertLink(value: string, start: number, end: number): MarkdownEditResult {
  const text = value.slice(start, end) || LINK_TEXT;
  const next = value.slice(0, start) + `[${text}](${LINK_URL})` + value.slice(end);
  const urlStart = start + text.length + 3;
  return {
    value: next,
    selectionStart: urlStart,
    selectionEnd: urlStart + LINK_URL.length,
  };
}

function insertImage(value: string, start: number, end: number): MarkdownEditResult {
  const alt = value.slice(start, end) || IMAGE_ALT;
  const next = value.slice(0, start) + `![${alt}](${IMAGE_URL})` + value.slice(end);
  const urlStart = start + alt.length + 4;
  return {
    value: next,
    selectionStart: urlStart,
    selectionEnd: urlStart + IMAGE_URL.length,
  };
}

/** Inserts a block at the end of the selection so selected text is preserved. */
function insertTable(value: string, end: number): MarkdownEditResult {
  const { lead, tail } = blockAffixes(value, end, end);
  const next = value.slice(0, end) + lead + TABLE + tail + value.slice(end);
  const cellStart = end + lead.length + 2;
  return {
    value: next,
    selectionStart: cellStart,
    selectionEnd: cellStart + TABLE_HEADER_CELL.length,
  };
}

/** Inserts a divider at the end of the selection so selected text is preserved. */
function insertDivider(value: string, end: number): MarkdownEditResult {
  const { lead, tail } = blockAffixes(value, end, end);
  const next = value.slice(0, end) + lead + "---" + tail + value.slice(end);
  const cursor = end + lead.length + 3;
  return { value: next, selectionStart: cursor, selectionEnd: cursor };
}

export function applyMarkdownAction(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  action: MarkdownAction,
  options?: { language?: string },
): MarkdownEditResult {
  const { start, end } = normalizeRange(value, selectionStart, selectionEnd);

  switch (action) {
    case "bold":
      return wrapInline(value, start, end, "**", "bold text");
    case "italic":
      return wrapInline(value, start, end, "_", "italic text");
    case "inline-code":
      return wrapInline(value, start, end, "`", "code");
    case "heading2":
      return applyHeading(value, start, end, "## ");
    case "heading3":
      return applyHeading(value, start, end, "### ");
    case "bullet-list":
      return toggleLinePrefix(value, start, end, "- ");
    case "ordered-list":
      return toggleLinePrefix(value, start, end, "1. ");
    case "quote":
      return toggleLinePrefix(value, start, end, "> ");
    case "code-block":
      return insertCodeBlock(value, start, end, options?.language);
    case "link":
      return insertLink(value, start, end);
    case "image":
      return insertImage(value, start, end);
    case "table":
      return insertTable(value, end);
    case "divider":
      return insertDivider(value, end);
  }
}
